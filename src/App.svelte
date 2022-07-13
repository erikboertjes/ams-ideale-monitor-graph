<script>
	import Table from "./components/table.svelte"
	import Network from "./components/network.svelte"
	import RadialTree from "./components/radialTree.svelte"

</script>

<main>
	<!-- <Table /> -->
	<!-- <div class="network-container"><Network /></div> -->
	<div class="tree-container"><RadialTree /></div>
</main>

<style>
	/* .network-container {
		height: 500px;
	} */
	main {
		height: 100%;
	}
	.tree-container {
		height: 100%;
	}
</style>
