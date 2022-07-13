<script>
  import { dimensions, monitors } from "../stores.js"
  $: console.log("dimensions", $dimensions)
  $: console.log("monitors", $monitors)

  //$dimensions is a derived store. create a local copy to store display
  //information such as position and 'showSubThemes'

  $: dimensionList = $dimensions.map(d => {
    let dimension = { ...d }
    d.yPos = 0
    d.themes.forEach(t => {
      t.yPos = 0;
      t.showSubThemes = false
      t.subThemes.forEach(s => {
        s.yPos = 0
      })
    })
    return d
  })

  $: setPositionOfListElements(dimensionList)

  const width = 1000
  const height = 1400
  const labelWidth = 300
  const headerHeight = 200
  const cellWidth = 20
  const cellSpacing = 12
  const rowHeight = 20
  const rowSpacing = 2
  const dimensionSpacing = 24

  const colors = [
    ["#724194", "#a274c2", "#e4cbf5"],
    ["#6a93cc", "#96b6e6", "#c7d6e8"],
    ["#357629", "#6ac75a", "#cae3c6"],
    ["#e0001b", "#e06978", "#f7b2bb"],
    ["#ffcb00", "#ffe78c", "#fff6d4"],
    ["#724194", "#a274c2", "#e4cbf5"],
    ["#724194", "#a274c2", "#e4cbf5"],
    ["#724194", "#a274c2", "#e4cbf5"]
  ]

  let svg //ref to svg element

  function sortList(dimensionList) {
    dimensionList.forEach(dimension => {
      dimension.themes.sort((t1, t2) => t2.nrMonitors - t1.nrMonitors)
      dimension.themes.forEach(theme => {
        theme.subThemes.sort((st1, st2) => st2.nrMonitors - st1.nrMonitors)
      })
    })
  }

  //calculates vertical position of each dimension, theme, and subtheme
  function setPositionOfListElements(dimensionList) {
    sortList(dimensionList) //sort list according to nr of monitors per theme / subtheme
    console.log("setPositionOfListElements")
    let y=0
    dimensionList.forEach(d => {
      d.yPos = y
      y += rowHeight + rowSpacing
      d.themes.forEach(t => {
        t.yPos = y
        y += rowHeight + rowSpacing
        if (t.showSubThemes) {
          t.subThemes.forEach(s => {
            s.yPos = y
            y += rowHeight + rowSpacing
          })
        }
      })
      y += dimensionSpacing
    })
  }

  function saveSvg() {
    const svgData = svg.outerHTML;
    const svgBlob = new Blob([svgData], {type:"image/svg+xml;charset=utf-8"});
    const svgUrl = URL.createObjectURL(svgBlob);
    const downloadLink = document.createElement("a");
    downloadLink.href = svgUrl;
    downloadLink.download = "table.svg";
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  }


</script>

<div>
  <svg {width} {height} bind:this={svg}>
    <g id="container" transform="translate(0, {headerHeight})">
      <g id="monitor-labels" transform="translate({labelWidth},0)">
        {#each $monitors as monitor, index}
          <text
            transform="translate({10 + (cellWidth + cellSpacing) * index}, 0) rotate(-45)"
            >
            { monitor.name }
          </text>
        {/each}
      </g>
      <g id="indicators">
        {#each dimensionList as dimension, dimensionIndex}
          <g transform="translate(0,{dimension.yPos})">
            <rect
              width={labelWidth-15}
              height={rowHeight}
              fill={colors[dimensionIndex][0]}>
            </rect>

            <text
              y={rowHeight}
              dx="2"
              dy="-4"
              font-size="16"
              fill="#ffffff">
              {dimension.name}
            </text>
          </g>
          {#each dimension.themes as theme}
            <g transform="translate(0,{theme.yPos})">
              <rect
                width={width}
                height={rowHeight}
                fill="#efefef">
              </rect>
              <text
                x="10"
                y={rowHeight}
                dy="-2"
                font-size="14"
                class="clickable"
                on:click="{() => {
                  theme.showSubThemes = !theme.showSubThemes;
                  dimensionList = [...dimensionList]
                  }}">
                {theme.name}
              </text>
              <g transform="translate({labelWidth},0)">
                {#each $monitors as monitor,index}

                    <rect
                      x={(cellWidth + cellSpacing) * index}
                      width={cellWidth}
                      height={rowHeight}
                      fill="{monitor.indicators.some(i => i.themeName == theme.name )
                        ? colors[dimensionIndex][1] : '#ffffff'} "
                      opacity="{monitor.indicators.some(i => i.themeName == theme.name )
                        ? 1 : 0.5} ">
                    </rect>

                {/each}
              </g>
            </g>
            {#if theme.showSubThemes}
              {#each theme.subThemes as subTheme}
                <g transform="translate(0,{subTheme.yPos})">
                  <text
                    x="20"
                    y={rowHeight}
                    dy="-2"
                    font-size="12"
                    fill="#333333">
                    {subTheme.name}
                  </text>
                  <g transform="translate({labelWidth},0)">
                    {#each $monitors as monitor,index}
                      {#if monitor.indicators.some(i =>
                        i.themeName == theme.name && i.subThemeName == subTheme.name
                      )}
                        <rect
                          x={(cellWidth + cellSpacing) * index}
                          width={cellWidth}
                          height={rowHeight}
                          fill="{colors[dimensionIndex][2]}">
                        </rect>
                      {/if}
                    {/each}
                  </g>
                </g>
              {/each}
            {/if}
          {/each}
        {/each}
      </g>
    </g>
  </svg>
  <button on:click={saveSvg}>Save table as svg</button>
</div>

<style>
  .clickable {
    cursor: pointer;
  }
</style>
