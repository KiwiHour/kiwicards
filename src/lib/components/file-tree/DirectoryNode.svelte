<script lang="ts">

    import type { ContextMenuOptions, Database } from "$lib/types";
    import { addNode, deleteNode, generateNewNode, getExpandedFolderUIDs, renameNode, sortTopLevelNodes } from "$lib/functions"
    import { createEventDispatcher, onMount } from "svelte";
    import { invalidateAll } from "$app/navigation";
    import ContextMenu from "../ContextMenu.svelte";

	// any node
	function handleFocus() {
		blurred = false
		dispatch("node-click", { nodeUId: node.UId, type: node.type })
	}

	function handleBlur() {
		blurred = true
	}

	function handleRightClick(event: MouseEvent) {
		rightClickPos = { x: event.clientX, y: event.clientY }
		showContextMenu = true;
	}

	function autofocus(el: HTMLElement) {
		el.focus()
	}

	// button control here
	async function handleNodeKeydown(event: KeyboardEvent) {
		if (["Backspace", "Delete"].includes(event.key)) {
			if (confirm(`Are you sure you want to delete the ${node.type} '${node.name}'`)) {
				let [_, err] = await deleteNode(node.UId)
				await invalidateAll()
				if (err) { alert(err) }
			}
		}
	}

	// folders
	function toggleFolder() {
		if (node.UId == "new-node") { return }
		expanded = !expanded
		expandedFolderUIds = getExpandedFolderUIDs(sessionStorage)
		if (expanded) {
			expandedFolderUIds.push(node.UId)
		} else {
			expandedFolderUIds = expandedFolderUIds.filter(UId => UId != node.UId)
		}
		sessionStorage.setItem("expanded-folder-uids", JSON.stringify(expandedFolderUIds))
	}

	function addFolderToExpandedList(folderUId: string) {
		if (folderUId == "new-node") { return }
		expandedFolderUIds = getExpandedFolderUIDs(sessionStorage)
		expandedFolderUIds.push(folderUId)
		sessionStorage.setItem("expanded-folder-uids", JSON.stringify(expandedFolderUIds))
	}

	// deck
	function openDeck() {
		dispatch("node-click", { nodeUId: node.UId, type: "deck", clickType: "left" })
	}

	// context menu handlers

	async function handleNewNameSubmit(event: KeyboardEvent) {
		if (event.key == "Enter") {
			if (!newName || newName.trim() == "" || newName == node.name) {
				newName = node.name
				renaming = false;
				return;
			}
			let [_, err] = await renameNode(node.UId, newName)
			await invalidateAll()
			if (err) { alert(err) }
		}
	}

	async function handleNewNodeNameSubmit(event: KeyboardEvent) {
		if (event.key == "Enter") {
			if (!newNodeName || newNodeName.trim() == "" ) {
				dispatch("remove-new-node")
				return;
			}
			// update name so it seem as if there is no delay
			disableNode = true
			isNew = false
			node.name = newNodeName
			
			let [newNodeUId, err] = await addNode(node.parentUId, newNodeName, node.type)
			node.parentUId ? addFolderToExpandedList(node.parentUId) : ""
			await invalidateAll()
			dispatch("added-new-node")
			isNew = false;
			if (err) { alert(err) }
		}
	}

	let deckContextMenuOptions: ContextMenuOptions = [
		{ name: "Delete", function: async () => {
			if (confirm(`Are you sure you want to delete the ${node.type} '${node.name}'`)) {
				let [_, err] = await deleteNode(node.UId)
				await invalidateAll()
				if (err) { alert(err) }
			}
		}},
		{ name: "Rename", function: () => renaming = true },
	]
	
	let folderContextMenuOptions: ContextMenuOptions = [
		// folder specific functions
		{ name: "New Folder", function: () => {
			newNode = generateNewNode("folder", node.UId) 
		}},
		{ name: "New Deck", function: () => {
			newNode = generateNewNode("deck", node.UId)
		}},
		...deckContextMenuOptions,
	]

	export let arrayedNode: Database.ArrayedNode<"deck" | "folder">
	export let nodeSelectEvent: { nodeUId: string, type: "folder" | "deck", clickType: "left" | "right" } | null
	export let openDeckUId: string | null
	export let depth: number;
	export let isNew: boolean;

	let dispatch = createEventDispatcher()
	let [node, children] = arrayedNode as [Database.DirectoryNode, any] // R.I.P

	let	open: boolean, 
		focused: boolean, 
		blurred: boolean, 
		renaming: boolean,
		newName: string = node.name,
		newNode: Database.DirectoryNode | null = null,
		expanded: boolean,
		expandedFolderUIds: string[],
		newNodeName: string,
		disableNode: boolean = false;
		
	let	showContextMenu: boolean = false,
		rightClickPos: { x: number, y: number };

	let contextMenuOptions = node.type == "folder" ? folderContextMenuOptions : deckContextMenuOptions;

	$: open = openDeckUId == node.UId // only useful for decks, but a folder will never have a deck uid so all good
	$: focused = nodeSelectEvent?.nodeUId == node.UId && !blurred
	$: blurred = nodeSelectEvent?.nodeUId == node.UId && blurred;
	$: expanded = newNode !== null || expanded;
	$: classes = `${focused ? 'focused' : ''} ${blurred ? 'blurred' : ''} ${open || expanded ? 'open' : ''}`

	onMount(() => {
		expandedFolderUIds = getExpandedFolderUIDs(sessionStorage)
		expanded = expandedFolderUIds.includes(node.UId)
	})

</script>

{#if showContextMenu}
	<ContextMenu on:close-context-menu={async () => showContextMenu = false} pos={rightClickPos} options={contextMenuOptions}/>
{/if}

<div class="node {node.type}" id={node.UId}>

	<button
		on:click={node.type == "deck" ? openDeck : toggleFolder}
		on:focus={handleFocus}
		on:blur={handleBlur}
		on:keydown={handleNodeKeydown}
		on:contextmenu|preventDefault|stopPropagation={handleRightClick}
		disabled={renaming || isNew || disableNode}
		type="button" class="name-and-button {classes}"
	>
		<div class="button-contents" style="padding-left: {(depth) * 1}vw;">
			<img class="toggle-indicator" alt="node icon">
			{#if renaming}
				<input id="rename-input" use:autofocus
					on:blur={() => {renaming = false}}
					on:keypress={handleNewNameSubmit} 
					bind:value={newName}
					type="text" />
			{:else if isNew}
				<input id="new-node-name-input" use:autofocus
					on:blur={() => {dispatch("remove-new-node")}}
					on:keypress={handleNewNodeNameSubmit} 
					bind:value={newNodeName}
					type="text" />
			{:else}
				<p class="prevent-select">{node.name}</p>
			{/if}
		</div>
	</button>

	{#if node.type == "folder"}

		<div class="folder-contents">

			{#if expanded || newNode}
				{#if newNode}
					<svelte:self on:remove-new-node={() => newNode = null} on:node-click depth={depth + 1} isNew={true} arrayedNode={[newNode, []]} {nodeSelectEvent} {openDeckUId}/>
				{/if}
				{#each sortTopLevelNodes(children) as arrayedNode}
					<svelte:self on:node-click depth={depth + 1} isNew={false} {arrayedNode} {nodeSelectEvent} {openDeckUId}/>
				{/each}
			{/if}

		</div>	

	{/if}

</div>

<style>

	@import "$lib/css/directory-node.css";

</style>