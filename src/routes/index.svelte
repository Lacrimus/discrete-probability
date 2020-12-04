<script>
	import 'w3-css/w3.css';

	import Section from "../components/Section.svelte";
	import Menu from "../components/Menu.svelte";
	import Formula from "../components/common/Formula.svelte";
	import FormulaInput from "../components/common/Formula-Input.svelte";

	export let name;
	export let ready = false;

	document.addEventListener("deviceready", () => {
		//start js calls
		ready = true;
	})
</script>

<style>

</style>

<!--TODO: import css libaries + custom css rulesets-->

<Menu></Menu>
<Section heading="Binomiale Wahrscheinlichkeitsfunktion">
	<div class="w3-card w3-cell">
		<Formula></Formula>
		<FormulaInput></FormulaInput>
	</div>
</Section>
