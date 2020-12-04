
(function(l, i, v, e) { v = l.createElement(i); v.async = 1; v.src = '//' + (location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; e = l.getElementsByTagName(i)[0]; e.parentNode.insertBefore(v, e)})(document, 'script');
var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function create_slot(definition, ctx, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, fn) {
        return definition[1]
            ? assign({}, assign(ctx.$$scope.ctx, definition[1](fn ? fn(ctx) : {})))
            : ctx.$$scope.ctx;
    }
    function get_slot_changes(definition, ctx, changed, fn) {
        return definition[1]
            ? assign({}, assign(ctx.$$scope.changed || {}, definition[1](fn ? fn(changed) : {})))
            : ctx.$$scope.changed || {};
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_data(text, data) {
        data = '' + data;
        if (text.data !== data)
            text.data = data;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function flush() {
        const seen_callbacks = new Set();
        do {
            // first, call beforeUpdate functions
            // and update components
            while (dirty_components.length) {
                const component = dirty_components.shift();
                set_current_component(component);
                update(component.$$);
            }
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            while (render_callbacks.length) {
                const callback = render_callbacks.pop();
                if (!seen_callbacks.has(callback)) {
                    callback();
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                }
            }
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
    }
    function update($$) {
        if ($$.fragment) {
            $$.update($$.dirty);
            run_all($$.before_render);
            $$.fragment.p($$.dirty, $$.ctx);
            $$.dirty = null;
            $$.after_render.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.callbacks.push(() => {
                outroing.delete(block);
                if (callback) {
                    block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_render } = component.$$;
        fragment.m(target, anchor);
        // onMount happens after the initial afterUpdate. Because
        // afterUpdate callbacks happen in reverse order (inner first)
        // we schedule onMount callbacks before afterUpdate callbacks
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_render.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        if (component.$$.fragment) {
            run_all(component.$$.on_destroy);
            component.$$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            component.$$.on_destroy = component.$$.fragment = null;
            component.$$.ctx = {};
        }
    }
    function make_dirty(component, key) {
        if (!component.$$.dirty) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty = blank_object();
        }
        component.$$.dirty[key] = true;
    }
    function init(component, options, instance, create_fragment, not_equal$$1, prop_names) {
        const parent_component = current_component;
        set_current_component(component);
        const props = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props: prop_names,
            update: noop,
            not_equal: not_equal$$1,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_render: [],
            after_render: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty: null
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, props, (key, value) => {
                if ($$.ctx && not_equal$$1($$.ctx[key], $$.ctx[key] = value)) {
                    if ($$.bound[key])
                        $$.bound[key](value);
                    if (ready)
                        make_dirty(component, key);
                }
            })
            : props;
        $$.update();
        ready = true;
        run_all($$.before_render);
        $$.fragment = create_fragment($$.ctx);
        if (options.target) {
            if (options.hydrate) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment.l(children(options.target));
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
    }

    /* src/components/Section.svelte generated by Svelte v3.6.2 */

    const file = "src/components/Section.svelte";

    const get_default_slot_changes = () => ({});
    const get_default_slot_context = () => ({ id: `sketch` });

    function create_fragment(ctx) {
    	var section, h1, t0, t1, t2, hr, section_class_value, current;

    	const default_slot_1 = ctx.$$slots.default;
    	const default_slot = create_slot(default_slot_1, ctx, get_default_slot_context);

    	return {
    		c: function create() {
    			section = element("section");
    			h1 = element("h1");
    			t0 = text(ctx.heading);
    			t1 = space();

    			if (default_slot) default_slot.c();
    			t2 = space();
    			hr = element("hr");
    			attr(h1, "class", "custom-underline-full");
    			add_location(h1, file, 17, 1, 340);

    			attr(hr, "class", "custom-bg-accent");
    			add_location(hr, file, 19, 1, 411);
    			attr(section, "class", section_class_value = "w3-container " + (ctx.center ? 'center' : '') + " " + ctx.classes);
    			attr(section, "id", ctx.id);
    			add_location(section, file, 16, 0, 263);
    		},

    		l: function claim(nodes) {
    			if (default_slot) default_slot.l(section_nodes);
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, section, anchor);
    			append(section, h1);
    			append(h1, t0);
    			append(section, t1);

    			if (default_slot) {
    				default_slot.m(section, null);
    			}

    			append(section, t2);
    			append(section, hr);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (!current || changed.heading) {
    				set_data(t0, ctx.heading);
    			}

    			if (default_slot && default_slot.p && changed.$$scope) {
    				default_slot.p(get_slot_changes(default_slot_1, ctx, changed, get_default_slot_changes), get_slot_context(default_slot_1, ctx, get_default_slot_context));
    			}

    			if ((!current || changed.center || changed.classes) && section_class_value !== (section_class_value = "w3-container " + (ctx.center ? 'center' : '') + " " + ctx.classes)) {
    				attr(section, "class", section_class_value);
    			}

    			if (!current || changed.id) {
    				attr(section, "id", ctx.id);
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(section);
    			}

    			if (default_slot) default_slot.d(detaching);
    		}
    	};
    }

    function instance($$self, $$props, $$invalidate) {
    	/** Additional classes to pass in */
    	let { classes = '', center = false, heading, id = "" } = $$props;

    	const writable_props = ['classes', 'center', 'heading', 'id'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Section> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;

    	$$self.$set = $$props => {
    		if ('classes' in $$props) $$invalidate('classes', classes = $$props.classes);
    		if ('center' in $$props) $$invalidate('center', center = $$props.center);
    		if ('heading' in $$props) $$invalidate('heading', heading = $$props.heading);
    		if ('id' in $$props) $$invalidate('id', id = $$props.id);
    		if ('$$scope' in $$props) $$invalidate('$$scope', $$scope = $$props.$$scope);
    	};

    	return {
    		classes,
    		center,
    		heading,
    		id,
    		$$slots,
    		$$scope
    	};
    }

    class Section extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, ["classes", "center", "heading", "id"]);

    		const { ctx } = this.$$;
    		const props = options.props || {};
    		if (ctx.heading === undefined && !('heading' in props)) {
    			console.warn("<Section> was created without expected prop 'heading'");
    		}
    	}

    	get classes() {
    		throw new Error("<Section>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set classes(value) {
    		throw new Error("<Section>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get center() {
    		throw new Error("<Section>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set center(value) {
    		throw new Error("<Section>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get heading() {
    		throw new Error("<Section>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set heading(value) {
    		throw new Error("<Section>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get id() {
    		throw new Error("<Section>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set id(value) {
    		throw new Error("<Section>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/Menu.svelte generated by Svelte v3.6.2 */

    const file$1 = "src/components/Menu.svelte";

    function create_fragment$1(ctx) {
    	var header, div0, h2, t1, h3, t3, div1, button0, t5, button1;

    	return {
    		c: function create() {
    			header = element("header");
    			div0 = element("div");
    			h2 = element("h2");
    			h2.textContent = "Diskrete Wahrscheinlichkeit";
    			t1 = space();
    			h3 = element("h3");
    			h3.textContent = "Binomialverteilung";
    			t3 = space();
    			div1 = element("div");
    			button0 = element("button");
    			button0.textContent = "Binomiale Wahrscheinlichkeitsfunktion";
    			t5 = space();
    			button1 = element("button");
    			button1.textContent = "Kumulative Wahrscheinlichkeitsfunktion";
    			add_location(h2, file$1, 15, 6, 211);
    			add_location(h3, file$1, 16, 6, 254);
    			attr(div0, "class", "w3-card w3-cell w3-container w3-round custom-bg-main");
    			add_location(div0, file$1, 14, 4, 138);
    			attr(button0, "class", "w3-button w3-round custom-bg-main");
    			attr(button0, "href", "#binom-dist");
    			add_location(button0, file$1, 19, 6, 345);
    			attr(button1, "class", "w3-button w3-round custom-bg-main");
    			attr(button1, "href", "#cumulat-dist");
    			add_location(button1, file$1, 20, 6, 467);
    			attr(div1, "class", "w3-section w3-bar w3-round ");
    			add_location(div1, file$1, 18, 4, 297);
    			attr(header, "class", "w3-container w3-padding-16");
    			add_location(header, file$1, 13, 0, 90);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, header, anchor);
    			append(header, div0);
    			append(div0, h2);
    			append(div0, t1);
    			append(div0, h3);
    			append(header, t3);
    			append(header, div1);
    			append(div1, button0);
    			append(div1, t5);
    			append(div1, button1);
    		},

    		p: noop,
    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(header);
    			}
    		}
    	};
    }

    class Menu extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment$1, safe_not_equal, []);
    	}
    }

    /* src/components/common/Formula.svelte generated by Svelte v3.6.2 */

    const file$2 = "src/components/common/Formula.svelte";

    function create_fragment$2(ctx) {
    	var div, math, mi0, t1, mo0, t3, mi1, t5, mo1, t7, mi2, t9, mo2, t11, mo3, t13, mi3, t15, mo4, t17, mi4, t19, mo5, t21, mi5, t23, mo6, t25, mi6, t27, mo7, t29, mo8, t31, mfrac, mi7, t33, mi8, t35, msup0, mi9, t37, mi10, t39, msup1, mrow, mo9, t41, mn, t43, mo10, t45, mi11, t47, mo11, t49, mi12;

    	return {
    		c: function create() {
    			div = element("div");
    			math = element("math");
    			mi0 = element("mi");
    			mi0.textContent = "P";
    			t1 = space();
    			mo0 = element("mo");
    			mo0.textContent = "(";
    			t3 = space();
    			mi1 = element("mi");
    			mi1.textContent = "X";
    			t5 = space();
    			mo1 = element("mo");
    			mo1.textContent = "=";
    			t7 = space();
    			mi2 = element("mi");
    			mi2.textContent = "k";
    			t9 = space();
    			mo2 = element("mo");
    			mo2.textContent = ")";
    			t11 = space();
    			mo3 = element("mo");
    			mo3.textContent = "=";
    			t13 = space();
    			mi3 = element("mi");
    			mi3.textContent = "B";
    			t15 = space();
    			mo4 = element("mo");
    			mo4.textContent = "(";
    			t17 = space();
    			mi4 = element("mi");
    			mi4.textContent = "k";
    			t19 = space();
    			mo5 = element("mo");
    			mo5.textContent = ",";
    			t21 = space();
    			mi5 = element("mi");
    			mi5.textContent = "n";
    			t23 = space();
    			mo6 = element("mo");
    			mo6.textContent = ",";
    			t25 = space();
    			mi6 = element("mi");
    			mi6.textContent = "p";
    			t27 = space();
    			mo7 = element("mo");
    			mo7.textContent = ")";
    			t29 = space();
    			mo8 = element("mo");
    			mo8.textContent = "=";
    			t31 = space();
    			mfrac = element("mfrac");
    			mi7 = element("mi");
    			mi7.textContent = "n";
    			t33 = space();
    			mi8 = element("mi");
    			mi8.textContent = "k";
    			t35 = space();
    			msup0 = element("msup");
    			mi9 = element("mi");
    			mi9.textContent = "p";
    			t37 = space();
    			mi10 = element("mi");
    			mi10.textContent = "k";
    			t39 = space();
    			msup1 = element("msup");
    			mrow = element("mrow");
    			mo9 = element("mo");
    			mo9.textContent = "(";
    			t41 = space();
    			mn = element("mn");
    			mn.textContent = "1";
    			t43 = space();
    			mo10 = element("mo");
    			mo10.textContent = "-";
    			t45 = space();
    			mi11 = element("mi");
    			mi11.textContent = "p";
    			t47 = space();
    			mo11 = element("mo");
    			mo11.textContent = ")";
    			t49 = space();
    			mi12 = element("mi");
    			mi12.textContent = "n - k";
    			add_location(mi0, file$2, 16, 6, 194);
    			add_location(mo0, file$2, 17, 6, 211);
    			add_location(mi1, file$2, 18, 6, 228);
    			add_location(mo1, file$2, 19, 6, 245);
    			add_location(mi2, file$2, 20, 6, 262);
    			add_location(mo2, file$2, 21, 6, 279);
    			add_location(mo3, file$2, 22, 6, 296);
    			add_location(mi3, file$2, 23, 6, 313);
    			add_location(mo4, file$2, 24, 6, 330);
    			add_location(mi4, file$2, 25, 6, 347);
    			add_location(mo5, file$2, 26, 6, 364);
    			add_location(mi5, file$2, 27, 6, 381);
    			add_location(mo6, file$2, 28, 6, 398);
    			add_location(mi6, file$2, 29, 6, 415);
    			add_location(mo7, file$2, 30, 6, 432);
    			add_location(mo8, file$2, 31, 6, 449);
    			add_location(mi7, file$2, 33, 8, 482);
    			add_location(mi8, file$2, 34, 8, 501);
    			add_location(mfrac, file$2, 32, 6, 466);
    			add_location(mi9, file$2, 37, 8, 548);
    			add_location(mi10, file$2, 38, 8, 567);
    			add_location(msup0, file$2, 36, 6, 533);
    			add_location(mo9, file$2, 42, 10, 630);
    			add_location(mn, file$2, 43, 10, 651);
    			add_location(mo10, file$2, 44, 10, 672);
    			add_location(mi11, file$2, 45, 10, 693);
    			add_location(mo11, file$2, 46, 10, 714);
    			add_location(mrow, file$2, 41, 8, 613);
    			add_location(mi12, file$2, 48, 8, 749);
    			add_location(msup1, file$2, 40, 6, 598);
    			add_location(math, file$2, 15, 4, 181);
    			attr(div, "class", "w3-container w3-padding-16 custom-bg-accent");
    			add_location(div, file$2, 14, 0, 114);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);
    			append(div, math);
    			append(math, mi0);
    			append(math, t1);
    			append(math, mo0);
    			append(math, t3);
    			append(math, mi1);
    			append(math, t5);
    			append(math, mo1);
    			append(math, t7);
    			append(math, mi2);
    			append(math, t9);
    			append(math, mo2);
    			append(math, t11);
    			append(math, mo3);
    			append(math, t13);
    			append(math, mi3);
    			append(math, t15);
    			append(math, mo4);
    			append(math, t17);
    			append(math, mi4);
    			append(math, t19);
    			append(math, mo5);
    			append(math, t21);
    			append(math, mi5);
    			append(math, t23);
    			append(math, mo6);
    			append(math, t25);
    			append(math, mi6);
    			append(math, t27);
    			append(math, mo7);
    			append(math, t29);
    			append(math, mo8);
    			append(math, t31);
    			append(math, mfrac);
    			append(mfrac, mi7);
    			append(mfrac, t33);
    			append(mfrac, mi8);
    			append(math, t35);
    			append(math, msup0);
    			append(msup0, mi9);
    			append(msup0, t37);
    			append(msup0, mi10);
    			append(math, t39);
    			append(math, msup1);
    			append(msup1, mrow);
    			append(mrow, mo9);
    			append(mrow, t41);
    			append(mrow, mn);
    			append(mrow, t43);
    			append(mrow, mo10);
    			append(mrow, t45);
    			append(mrow, mi11);
    			append(mrow, t47);
    			append(mrow, mo11);
    			append(msup1, t49);
    			append(msup1, mi12);
    		},

    		p: noop,
    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div);
    			}
    		}
    	};
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { formula } = $$props;

    	const writable_props = ['formula'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Formula> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ('formula' in $$props) $$invalidate('formula', formula = $$props.formula);
    	};

    	return { formula };
    }

    class Formula extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$2, safe_not_equal, ["formula"]);

    		const { ctx } = this.$$;
    		const props = options.props || {};
    		if (ctx.formula === undefined && !('formula' in props)) {
    			console.warn("<Formula> was created without expected prop 'formula'");
    		}
    	}

    	get formula() {
    		throw new Error("<Formula>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set formula(value) {
    		throw new Error("<Formula>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/common/Formula-Input.svelte generated by Svelte v3.6.2 */

    const file$3 = "src/components/common/Formula-Input.svelte";

    function create_fragment$3(ctx) {
    	var form, label0, math0, mi0, t1, input0, t2, p0, t4, label1, math1, mi1, t6, input1, t7, p1, t9, label2, math2, mi2, t11, input2, t12, p2;

    	return {
    		c: function create() {
    			form = element("form");
    			label0 = element("label");
    			math0 = element("math");
    			mi0 = element("mi");
    			mi0.textContent = "k";
    			t1 = space();
    			input0 = element("input");
    			t2 = space();
    			p0 = element("p");
    			p0.textContent = "Trefferzahl";
    			t4 = space();
    			label1 = element("label");
    			math1 = element("math");
    			mi1 = element("mi");
    			mi1.textContent = "n";
    			t6 = space();
    			input1 = element("input");
    			t7 = space();
    			p1 = element("p");
    			p1.textContent = "Anzahl der Versuche";
    			t9 = space();
    			label2 = element("label");
    			math2 = element("math");
    			mi2 = element("mi");
    			mi2.textContent = "p";
    			t11 = space();
    			input2 = element("input");
    			t12 = space();
    			p2 = element("p");
    			p2.textContent = "Trefferwahrscheinlichkeit (in %)";
    			add_location(mi0, file$3, 16, 8, 176);
    			add_location(math0, file$3, 15, 6, 161);
    			add_location(label0, file$3, 14, 4, 140);
    			attr(input0, "class", "custom-input");
    			attr(input0, "type", "text");
    			attr(input0, "maxlength", "2");
    			add_location(input0, file$3, 19, 4, 218);
    			add_location(p0, file$3, 20, 4, 277);
    			add_location(mi1, file$3, 23, 8, 336);
    			add_location(math1, file$3, 22, 6, 321);
    			add_location(label1, file$3, 21, 4, 300);
    			attr(input1, "class", "custom-input");
    			attr(input1, "type", "text");
    			attr(input1, "maxlength", "2");
    			add_location(input1, file$3, 26, 4, 378);
    			add_location(p1, file$3, 27, 4, 437);
    			add_location(mi2, file$3, 30, 8, 512);
    			add_location(math2, file$3, 29, 6, 497);
    			add_location(label2, file$3, 28, 4, 476);
    			attr(input2, "class", "custom-input");
    			attr(input2, "type", "text");
    			add_location(input2, file$3, 33, 4, 554);
    			add_location(p2, file$3, 34, 4, 599);
    			attr(form, "class", "w3-container w3-section");
    			add_location(form, file$3, 13, 0, 97);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, form, anchor);
    			append(form, label0);
    			append(label0, math0);
    			append(math0, mi0);
    			append(form, t1);
    			append(form, input0);
    			append(form, t2);
    			append(form, p0);
    			append(form, t4);
    			append(form, label1);
    			append(label1, math1);
    			append(math1, mi1);
    			append(form, t6);
    			append(form, input1);
    			append(form, t7);
    			append(form, p1);
    			append(form, t9);
    			append(form, label2);
    			append(label2, math2);
    			append(math2, mi2);
    			append(form, t11);
    			append(form, input2);
    			append(form, t12);
    			append(form, p2);
    		},

    		p: noop,
    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(form);
    			}
    		}
    	};
    }

    class Formula_Input extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment$3, safe_not_equal, []);
    	}
    }

    /* src/routes/index.svelte generated by Svelte v3.6.2 */

    const file$4 = "src/routes/index.svelte";

    // (25:0) <Section heading="Binomiale Wahrscheinlichkeitsfunktion">
    function create_default_slot(ctx) {
    	var div, t, current;

    	var formula = new Formula({ $$inline: true });

    	var formulainput = new Formula_Input({ $$inline: true });

    	return {
    		c: function create() {
    			div = element("div");
    			formula.$$.fragment.c();
    			t = space();
    			formulainput.$$.fragment.c();
    			attr(div, "class", "w3-card w3-cell");
    			add_location(div, file$4, 25, 1, 561);
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);
    			mount_component(formula, div, null);
    			append(div, t);
    			mount_component(formulainput, div, null);
    			current = true;
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(formula.$$.fragment, local);

    			transition_in(formulainput.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(formula.$$.fragment, local);
    			transition_out(formulainput.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div);
    			}

    			destroy_component(formula, );

    			destroy_component(formulainput, );
    		}
    	};
    }

    function create_fragment$4(ctx) {
    	var t, current;

    	var menu = new Menu({ $$inline: true });

    	var section = new Section({
    		props: {
    		heading: "Binomiale Wahrscheinlichkeitsfunktion",
    		$$slots: { default: [create_default_slot] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	return {
    		c: function create() {
    			menu.$$.fragment.c();
    			t = space();
    			section.$$.fragment.c();
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			mount_component(menu, target, anchor);
    			insert(target, t, anchor);
    			mount_component(section, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var section_changes = {};
    			if (changed.$$scope) section_changes.$$scope = { changed, ctx };
    			section.$set(section_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(menu.$$.fragment, local);

    			transition_in(section.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(menu.$$.fragment, local);
    			transition_out(section.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(menu, detaching);

    			if (detaching) {
    				detach(t);
    			}

    			destroy_component(section, detaching);
    		}
    	};
    }

    function instance$2($$self, $$props, $$invalidate) {
    	

    	let { name, ready = false } = $$props;

    	document.addEventListener("deviceready", () => {
    		//start js calls
    		$$invalidate('ready', ready = true);
    	});

    	const writable_props = ['name', 'ready'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Index> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ('name' in $$props) $$invalidate('name', name = $$props.name);
    		if ('ready' in $$props) $$invalidate('ready', ready = $$props.ready);
    	};

    	return { name, ready };
    }

    class Index extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$4, safe_not_equal, ["name", "ready"]);

    		const { ctx } = this.$$;
    		const props = options.props || {};
    		if (ctx.name === undefined && !('name' in props)) {
    			console.warn("<Index> was created without expected prop 'name'");
    		}
    	}

    	get name() {
    		throw new Error("<Index>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set name(value) {
    		throw new Error("<Index>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get ready() {
    		throw new Error("<Index>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set ready(value) {
    		throw new Error("<Index>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const app = new Index({
    	target: document.body,
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
