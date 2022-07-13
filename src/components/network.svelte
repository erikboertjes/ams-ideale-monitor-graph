<script>
  import { monitors, dimensions } from "../stores.js"
  import { onMount } from 'svelte'
  import { forceX, forceY, forceManyBody, forceLink, forceSimulation, forceCollide } from 'd3-force'
  //import { scaleSqrt } from 'd3-scale'
  import { select } from 'd3-selection'
  import { zoom } from 'd3-zoom'

  let networkContainer

  let svg //ref to svg element
  let network //ref to g element containing nodes and links

  let networkWidth = 200
  let networkHeight = 200

  let simulation
  let nodes = []
  let links = [] //links between partners and projects
  let nodesInNetwork = []
  let linksInNetwork = []
  const colors = {
    ams: "rgb(224,0,27)",
    partner: "#ffcb00",
    project: "#ffffff"
  }

  $: console.log($dimensions)

  // $: {
  //   nodes = []
  //   links = []
  //   $monitors.forEach(m => {
  //     console.log("adding monitor", m)
  //     const monitorNode = {
  //       id: m.name,
  //       type: "monitor",
  //       color: "#557722",
  //       radius: 50
  //     }
  //     nodes.push(monitorNode)
  //     m.indicators.forEach(i => {
  //       let themeNode = nodes.find(n => n.id == i.themeName)
  //       if (!themeNode) {
  //         themeNode = {
  //           id: i.themeName,
  //           type: "theme",
  //           color: "#997711",
  //           radius: 20
  //         }
  //         nodes.push(themeNode)
  //       }
  //       links.push({
  //         source: m.name,
  //         target: i.themeName
  //       })
  //     })
  //   })
  // }
  $: {
    nodes = []
    links = []
    const cityNode = {
      id: 'Amsterdam',
      level: 0,
      color: "#ff0000",
      radius: 60,
      fx: networkWidth/2,
      fy: networkHeight/2
    }
    nodes.push(cityNode)
    $dimensions.forEach(d => {
      console.log("adding dimension", d)
      const dimensionNode = {
        id: d.name,
        level: 1,
        color: "#557722",
        radius: 50
      }
      nodes.push(dimensionNode)
      links.push({
        source: cityNode.id,
        target: dimensionNode.id
      })
      d.themes.forEach(th => {
        const themeNode = {
            id: `${dimensionNode.id}_${th.name}`,
            level: 2,
            type: "theme",
            color: "#997711",
            radius: 20
          }
        nodes.push(themeNode)
        links.push({
          source: dimensionNode.id,
          target: themeNode
        })
        th.subThemes.forEach(st => {
          const subThemeNode = {
              id: `${themeNode.id}_${st.name}`,
              level: 3,
              type: "subTheme",
              color: "#774422",
              radius: 10
            }
          nodes.push(subThemeNode)
          links.push({
            source: themeNode.id,
            target: subThemeNode.id
          })
        })
      })
    })
  }

  $: console.log("nodes", nodes)
  $: console.log("links", links)


  //anytime nodes or links change, restart simulation with new nodes and links
  $: {
    restartNetwork(nodes, links)
    //restartNetwork(nodes.filter(n => n.type!="project"), partnerLinks)
  }

  function replace(p) {
    if (p.includes("EEMCS")) return "TUDelft faculty of EEMCS"; else return p;
  }

  onMount(() => {
    initZoom()
    initNetwork()
    resize()
  })

  function initZoom() {
    select(svg).call(zoom().on("zoom",
      (e) => {
        select(network).attr("transform", e.transform)
      }
    ))
  }

  function initNetwork() {
    console.log("initializing network")
    resize()
    //gravitate towards center
    const fX = forceX(networkWidth/2).strength(-0.005)
    const fY = forceY(networkHeight/2).strength(-0.005)
    simulation = forceSimulation(nodesInNetwork)
      // .force("x", fX)
      // .force("y", fY)
      .force("charge", forceManyBody().strength(-500))
      .force("link", forceLink(linksInNetwork).id(function(d) { return d.id; }))
      .force("collide", forceCollide().radius(n => 1.2 * n.radius).iterations(2))
      .on("tick", () => ticked()) //anonymous, otherwise 'this' refers to simulation
  }

  function ticked() {
    nodesInNetwork = [...nodesInNetwork]
    linksInNetwork = [...linksInNetwork]
  }

  function restartNetwork(nodes, links) {
    nodesInNetwork = [...nodes]
    linksInNetwork = [...links]
    if (simulation) {
      simulation.stop()
      simulation.nodes(nodesInNetwork)
      simulation.force("link").links(linksInNetwork)
      simulation.alpha(1).restart()
    }
  }

  function resize() {
    const bboxNetwork = networkContainer.getBoundingClientRect();
    networkWidth = bboxNetwork.width;
    networkHeight = bboxNetwork.height;
  }

  function saveSvg() {
    const svgData = svg.outerHTML;
    const svgBlob = new Blob([svgData], {type:"image/svg+xml;charset=utf-8"});
    const svgUrl = URL.createObjectURL(svgBlob);
    const downloadLink = document.createElement("a");
    downloadLink.href = svgUrl;
    downloadLink.download = "network.svg";
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  }


</script>

<div class="main-container">
<div class="network-container" bind:this={networkContainer}>
  <svg width={networkWidth} height={networkHeight} bind:this={svg}>
    <rect
      width={networkWidth}
      height={networkHeight}
      fill="rgb(114,65,148)">
    </rect>

    <g id="network" bind:this={network}
      transform="translate(100 0)">
      <g id="links">
        {#each linksInNetwork as link}
          <line
            x1={link.source.x}
            y1={link.source.y}
            x2={link.target.x}
            y2={link.target.y}
            stroke="#ffffff"
            stroke-width={2}
            opacity="0.4">
          </line>
        {/each}
      </g>
      <g id="nodes">
        {#each nodesInNetwork as node}
          <circle
            cx={node.x}
            cy={node.y}
            r={node.radius}
            fill={node.color}
            on:click={()=>{console.log(node)}}
            >
          </circle>
        {/each}
      </g>
      <!-- <g id="label-backgrounds">
        {#each nodesInNetwork
          .filter(n => n.type == "partner" && n.radius > 14)
          as node, i}
          {#if textLabelElements[i]}
            <rect
              x={node.x-(textLabelElements[i].getBBox().width + 8)/2}
              y={node.y-8}
              width={textLabelElements[i].getBBox().width + 8}
              height="18"
              fill="#000000">
            </rect>
          {/if}
        {/each}
      </g> -->

      <!--<g id="labels">
        {#each nodesInNetwork
          .filter(n => n.type == "partner" && n.radius > 14)
          as node, i}

          <text bind:this="{textLabelElements[i]}"
            x={node.x}
            y={node.y+8}
            text-anchor="middle"
            fill="#ffffff">
            { node.id }
          </text>
        {/each}
      </g>-->

    </g>


  </svg>
  <button on:click={saveSvg}>Save network as svg</button>
</div>

</div>


<svelte:window on:resize='{resize}'/>

<style>
  .main-container {
    height: 100%;
    background-color: #ffffff
  }
  .network-container {
    height: 100%;
  }
</style>
