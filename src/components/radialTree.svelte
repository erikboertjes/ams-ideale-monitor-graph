<script>
  import { onMount } from 'svelte'
  import { tree, hierarchy } from 'd3-hierarchy'
  import { linkRadial } from 'd3-shape'
  import { select } from 'd3-selection'
  import { zoom } from 'd3-zoom'
  import { dimensions, monitors } from '../stores.js'

  let width = 1000
  let height = 1000

  const getPathForLink = linkRadial().angle(d => d.x).radius(d => d.y)

  let root
  let graphContainer
  let svg
  let graph
  let selectedMonitorName = "All"

  const treeConstructor = tree()
    .size([2 * Math.PI, 800])
    .separation(function(a, b) { return (a.parent == b.parent ? 1 : 2) / a.depth; });

  let nodeTree = null

  let levelNames = ['root', 'dimensions', 'themes', 'subThemes', 'indicators']
  const colors = [
    ["#6a93cc", "#96b6e6", "#c7d6e8"],
    ["#357629", "#6ac75a", "#cae3c6"],
    ["#724194", "#a274c2", "#e4cbf5"],
    ["#ffcb00", "#ffe78c", "#fff6d4"],
    ["#8e9f07", "#70a7bf", "#70a7bf"]
  ]
  const amsColor = "#e0001b"

	$: monitorNames = ['All'].concat($monitors.map(m => m.name))

  onMount(() => {
    initZoom()
    resize()
  })

  function initZoom() {
    select(svg).call(zoom().on("zoom",
      (e) => {
        select(graph).attr("transform", e.transform)
      }
    ))
  }

  // add data to tree recursively
  // dataNode is data from dimensions tree. It will be added as as
  // new childnode to tree node 'n'
  function addChildToTree(n, dataNode, level, colorIndex) {
    //get node for data node
    let childNode = {
      'id': dataNode.name,
      'colorIndex': colorIndex,
      'nrMonitors': 'nrMonitors' in dataNode ? dataNode['nrMonitors'] : -1,
      'monitors': 'monitors' in dataNode ? dataNode['monitors'] : []
     }
    n.children.push(childNode)
    let dataNodeChildren = []
    if (level < levelNames.length-1) {
      dataNodeChildren = dataNode[levelNames[level+1]]
    }
    if (dataNodeChildren.length > 0) {
      childNode.children = []
      dataNodeChildren.forEach(childDataNode => {
        addChildToTree(childNode, childDataNode, level+1, colorIndex)
      })
    }
  }

  $: nodes = nodeTree ? nodeTree.descendants() : []
  $: links = nodeTree ? nodeTree.links() : []

  $: filteredNodes = nodes.filter(node => nodeIsShowing(selectedMonitorName, node))
  $: filteredLinks = links.filter(link => nodeIsShowing(selectedMonitorName, link.source) &&
                                          nodeIsShowing(selectedMonitorName, link.target))



  $: {
    console.log("building tree", $dimensions)
    root  = {
       'id': 'Amsterdam',
       'colorIndex': -1,
       'children': [],
       'nrMonitors': -1,
       'monitors': []
     }
    if ($dimensions.length > 0) {
      $dimensions.forEach((d,colorIndex) => {
        addChildToTree(root, d, 1, colorIndex)
      })
      const rootNode = hierarchy(root)
      console.log("root", root, rootNode)
      nodeTree = treeConstructor(rootNode)
      console.log("nodeTree", nodeTree)
      console.log("descendants", nodeTree.descendants())
    }
  }

  function nodeIsShowing(selectedMonitorName, node) {
    return (selectedMonitorName == 'All' ||
    node.data.id == 'Amsterdam' ||
    node.data.monitors.includes(selectedMonitorName))
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

  function resize() {
    const bboxNetwork = graphContainer.getBoundingClientRect();
    width = bboxNetwork.width;
    height = bboxNetwork.height;
    console.log("width, height", width, height)
  }

</script>

<div class="main-container">
  <div>
    <select bind:value={selectedMonitorName}>
      {#each monitorNames as monitor}
        <option value={monitor}>
          {monitor}
        </option>
      {/each}
    </select>
  </div>
  <div class="graph-container" bind:this={graphContainer}>
    <div>{ selectedMonitorName }</div>
    <svg {width} {height} bind:this={svg}>
      <g id="zoom-and-pan-area" bind:this={graph}>
        <g transform="translate({width/2},{height/2})">
          <g id="links">
            {#each filteredLinks as link}
              <path d="{getPathForLink(link)}" stroke="#666666" fill="none">
              </path>
            {/each}
          </g>
          <g id="nodes">
            {#each filteredNodes as node}
              <g transform="rotate({node.x * 180 / Math.PI - 90}) translate({node.y},0)">
                <circle
                  x="0"
                  y="0"
                  r="8"
                  fill="{node.data.colorIndex == -1 ? amsColor : colors[node.data.colorIndex][0]}">
                </circle>
              </g>
            {/each}
          </g>
          <g id="labels_background">
            {#each filteredNodes as node}
              <g transform="rotate({node.x * 180 / Math.PI - 90}) translate({node.y},0)">
                <text
                  transform="rotate({node.x >= Math.PI ? 180 : 0})"
                  x="{node.x < Math.PI === !node.children ? 10 : -10}"
                  dy="0.32em"
                  text-anchor="{node.x < Math.PI === !node.children ? 'start' : 'end'}"
                  font-size="10pt"
                  stroke="#fff"
                  stroke-width="3"
                  fill="none"
                  >
                  { node.data.id}
                </text>
              </g>
            {/each}
          </g>
          <g id="labels">
            {#each filteredNodes as node}
              <g transform="rotate({node.x * 180 / Math.PI - 90}) translate({node.y},0)">
                <text
                  transform="rotate({node.x >= Math.PI ? 180 : 0})"
                  x="{node.x < Math.PI === !node.children ? 10 : -10}"
                  dy="0.32em"
                  text-anchor="{node.x < Math.PI === !node.children ? 'start' : 'end'}"
                  font-size="10pt"
                  >
                  { node.data.id}
                </text>
              </g>
            {/each}
          </g>
        </g>
      </g>
    </svg>
  </div>
  <div><button on:click={saveSvg}>Save network as svg</button></div>
</div>

<svelte:window on:resize='{resize}'/>

<style>
  .main-container {
    display: grid;
    grid-template-rows: max-content auto max-content;
    height: 100%;
  }
  .graph-container {
    overflow-y: auto;
  }
  text {
    user-select: none;
  }
</style>
