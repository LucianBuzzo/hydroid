require('@babel/register')

const {
	JSDOM
} = require('jsdom')
const VDOM = new JSDOM()
global.window = VDOM.window
global.document = VDOM.window.document

const {
	test
} = require('ava')
const spy = require('ispy')
const simu = require('simulate')

const h = require('../').Hydroid

test('Can render simple elements', (t) => {
	t.is(h('h1').outerHTML, '<h1></h1>')
	t.is(h('h1', {
		markup: 'hello world'
	}).outerHTML, '<h1>hello world</h1>')
})

test('Can nest simple elements', (t) => {
	t.is(h('div', {
		markup: [
			[
				[ 'h1', 'Title' ],
				[ 'p', 'Paragraph' ]
			]
		]
	}).outerHTML, '<div><h1>Title</h1><p>Paragraph</p></div>')
})

test('Can nest hydroid elements', (t) => {
	t.is(h('div', {
		markup: [
			h('h1', {
				markup: 'Title'
			}),
			h('p', {
				markup: 'Paragraph'
			})
		]
	}).outerHTML, '<div><h1>Title</h1><p>Paragraph</p></div>')
})

test('Should skip null arguments in markup', (t) => {
	t.is(h('h1', {
		markup: null
	}).outerHTML, '<h1></h1>')
	t.is(h('h1', {
		markup: [ null, 'hello world' ]
	}).outerHTML, '<h1>hello world</h1>')
})

test('Can use namespace in name', (t) => {
	t.is(h('myns:mytag').outerHTML, '<myns:mytag></myns:mytag>')
})

test('Can use id selector', (t) => {
	t.is(h('div#frame').outerHTML, '<div id="frame"></div>')
})

test('Can use id and class selector', (t) => {
	t.is(h('div.panel#app').outerHTML, '<div class="panel" id="app"></div>')
})

test('Can use class selector', (t) => {
	t.is(h('div.panel').outerHTML, '<div class="panel"></div>')
})

test('Can use multiple class selectors', (t) => {
	t.is(h('div.panel.top.green').outerHTML, '<div class="panel top green"></div>')
})

test('Using a selector without a tag name should default to a div element', (t) => {
	t.is(h('.panel').outerHTML, '<div class="panel"></div>')
	t.is(h('#frame').outerHTML, '<div id="frame"></div>')
})

test('Can set properties', (t) => {
	const anchor = h('a', {
		markup: [
			{
				href: 'http://google.com'
			}
		]
	})
	t.is(anchor.href, 'http://google.com/')

	const checkbox = h('input', {
		markup: [
			{
				name: 'yes',
				type: 'checkbox'
			}
		]
	})

	t.is(checkbox.outerHTML, '<input name="yes" type="checkbox">')
})

test('Setting properties ignores prototype properties', (t) => {
	class Options {
		constructor (options) {
			// eslint-disable-next-line
			for (const key in options) {
				this[key] = options[key]
			}
		}

		log () {
			console.log(this)
		}
	}

	const checkbox = h('input', {
		markup: [
			new Options({
				name: 'yes',
				type: 'checkbox'
			})
		]
	})

	t.is(checkbox.outerHTML, '<input name="yes" type="checkbox">')
})

test('Can register event handlers using element attributes', (t) => {
	const onClick = spy()
	const para = h('p', {
		markup: [
			{
				onclick: onClick
			},
			'something'
		]
	})
	simu.click(para)
	t.true(onClick.called)
})

test('Can set styles using element attributes', (t) => {
	const div = h('div', {
		markup: [
			{
				style: {
					color: 'red'
				}
			}
		]
	})
	t.is(div.style.color, 'red')
})

test('Can set style strings using element attributes', (t) => {
	const div = h('div', {
		markup: [
			{
				style: 'color: red;'
			}
		]
	})

	t.is(div.style.color, 'red')
	t.is(div.outerHTML, '<div style="color: red;"></div>')
})

test('Can set attributes', (t) => {
	const src = 'http://placekitten.com/200/300'
	const img = h('img', {
		markup: [
			{
				attrs: {
					src
				}
			}
		]
	})
	t.is(img.getAttribute('src'), src)
})

test('Can set data attributes', (t) => {
	const div = h('div', {
		markup: [
			{
				'data-value': 5
			}
		]
	})
	t.is(div.getAttribute('data-value'), '5')
})

test('boolean, number, date and regex get stringified', (t) => {
	const element = h('p', {
		markup: [
			true,
			false,
			4,
			new Date('Mon Jan 15 2001'),
			/hello/
		]
	})

	t.truthy(element.outerHTML.match(/<p>truefalse4Mon Jan 15.+2001.*\/hello\/<\/p>/))
})

test('Can handle unicode selectors', (t) => {
	t.is(h('.⛄').outerHTML, '<div class="⛄"></div>')
	t.is(h('span#⛄').outerHTML, '<span id="⛄"></span>')
})

test('Can attach to an existing node', (t) => {
	const node1 = h('div')
	t.is(h(node1, {
		markup: [
			h('h1', {
				markup: 'hello world'
			})
		]
	}).outerHTML, '<div><h1>hello world</h1></div>')

	const node2 = document.createElement('div')
	t.is(h(node2, {
		markup: [
			h('h1', {
				markup: 'hello world'
			})
		]
	}).outerHTML, '<div><h1>hello world</h1></div>')

	const node3 = h('div')
	t.is(h(node3, {
		markup: [
			[
				[ 'h1', 'hello world' ]
			]
		]
	}).outerHTML, '<div><h1>hello world</h1></div>')
})

/* Re-enable once I figure this out in JSdom
test('Can add styles', (t) => {
	const element = h('h1', {
		markup: [
			'hello world'
		],
		style: {
			fontSize: 36
		}
	})
	const stylesheets = document.querySelectorAll('style')
	stylesheets.forEach((style) => {
		console.log(style.innerText)
	})
	t.is(window.getComputedStyle(element)['font-size'], '36px')
})
*/
