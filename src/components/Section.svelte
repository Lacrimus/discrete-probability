<script>
	/** Additional classes to pass in */
	export let classes = '';
	/** Center content */
	export let center = false;
	/** Heading */
	export let heading;
	/** ID of the section */
	export let id = "";
</script>

<!--
	@component
	A full-width section
-->

<section class="w3-container {center ? 'center' : ''} {classes}" id="{id}">
	<h1 class="custom-underline-full">{heading}</h1>
	<slot id="sketch"/>
	<hr class="custom-bg-accent">
</section>
