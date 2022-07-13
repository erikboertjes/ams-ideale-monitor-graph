import { readable, writable, derived } from "svelte/store";
import { csv } from "d3-fetch";


const dimensionThemeMapping = readable([], function start(set) {
  csv("./data/dimension_theme_mapping.csv")
    .then(data => {
      console.log("dimension_theme_mapping", data);
      set(data);
    });
  return function stop() {};
});

const themeSubthemeMapping = readable([], function start(set) {
  csv("./data/theme_subtheme_mapping.csv")
    .then(data => {
      set(data);
    });
  return function stop() {};
});

const indicatorPerMonitor = readable([], function start(set) {
  csv("./data/indicatorPerMonitor.csv")
    .then(data => {
      console.log("indicatorPerMonitor", data)
      set(data);
    });
  return function stop() {};
});

// returns list of dimension nodes, each of which has themes, each theme has subthemes
//
const dimensions2 = derived(
  [dimensionThemeMapping, themeSubthemeMapping, indicatorPerMonitor],
  ([$dimensionThemeMapping, $themeSubthemeMapping, $indicatorPerMonitor]) => {
    let dimensions = []
    $dimensionThemeMapping.forEach(dt => {
      let dimension = dimensions.find(d => d.name == dt.dimension)
      if (!dimension) {
        dimension = {
          name: dt.dimension,
          themes: []
        }
        dimensions.push(dimension)
      }
      dimension.themes.push({
        name: dt.theme,
        subThemes: []
      })
    })
    let allThemes = dimensions.map(d => d.themes).flat()
    $themeSubthemeMapping.forEach(tst => {
      // there can be multiple themes with the same subtheme
      let themes = allThemes.filter(t => t.name.toLowerCase() == tst.theme.toLowerCase())
      themes.forEach(theme => {
        theme.subThemes.push({
          name: tst.subtheme
        })
      })
    })
    //add nr of monitors per dimension, theme and subtheme
    dimensions.forEach(dimension => {
      dimension.nrMonitors = $indicatorPerMonitor
        .filter(i => dimension.name.toLowerCase() == i.dimension.toLowerCase())
        .map(m => m.monitor)
        .filter((v, i, a) => a.indexOf(v) === i)
        .length
      dimension.themes.forEach(theme => {
        theme.nrMonitors = $indicatorPerMonitor
          .filter(i => theme.name.toLowerCase() == i.theme.toLowerCase())
          .map(m => m.monitor)
          .filter((v, i, a) => a.indexOf(v) === i)
          .length
        theme.subThemes.forEach(subTheme => {
          subTheme.nrMonitors = $indicatorPerMonitor
            .filter(i => theme.name.toLowerCase() ==
              i.theme.toLowerCase() && subTheme.name.toLowerCase() == i.sub_theme.toLowerCase())
            .map(m => m.monitor)
            .filter((v, i, a) => a.indexOf(v) === i)
            .length
        })
      })
    })
    return dimensions
})

const dimensions = derived(
  indicatorPerMonitor,
  ($indicatorPerMonitor) => {
    let dimensions = []
    $indicatorPerMonitor.forEach(i => {
      let dimension = dimensions.find(d => d.name == i.dimension)
      if (!dimension) {
        dimension = {
          name: i.dimension,
          monitors: [],
          themes: []
        }
        dimensions.push(dimension)
      }
      if (!dimension.monitors.includes(i.monitor)) {
        dimension.monitors.push(i.monitor)
      }
      let theme = dimension.themes.find(t => t.name == i.theme)
      if (!theme) {
        theme = {
          name: i.theme,
          monitors: [],
          subThemes: []
        }
        dimension.themes.push(theme)
      }
      if (!theme.monitors.includes(i.monitor)) {
        theme.monitors.push(i.monitor)
      }
      let subTheme = theme.subThemes.find(st => st.name == i.sub_theme)
      if (!subTheme) {
        subTheme = {
          name: i.sub_theme,
          monitors: [],
          indicators: []
        }
        theme.subThemes.push(subTheme)
      }
      if (!subTheme.monitors.includes(i.monitor)) {
        subTheme.monitors.push(i.monitor)
      }
      let indicator = subTheme.indicators.find(ind => ind.name == i.short_indicator)
      if (!indicator) {
        indicator = {
          name: i.short_indicator,
          monitors: [],
          indicators: []
        }
        subTheme.indicators.push(indicator)
      }
      if (!indicator.monitors.includes(i.monitor)) {
        indicator.monitors.push(i.monitor)
      }
    })

    return dimensions
})

const monitors = derived(indicatorPerMonitor, $indicatorPerMonitor => {
  let monitors = []
  $indicatorPerMonitor.forEach(d => {
    let monitor = monitors.find(m => m.name == d.monitor)
    if (!monitor) {
      monitor = {
        name: d.monitor,
        indicators: []
      }
      monitors.push(monitor)
    }
    if (!monitor.indicators.some(i => i.themeName == d.theme && i.subThemeName == d.sub_theme)) {
      monitor.indicators.push({
        themeName: d.theme,
        subThemeName: d.sub_theme
      })
    }
  })
  monitors.sort((m1, m2) => m2.indicators.length - m1.indicators.length)
  return monitors
})


export {
  dimensions,
  monitors
}
