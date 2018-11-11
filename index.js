import jss from 'jss'
import preset from 'jss-preset-default'
import uuid from 'uuid'

// One time setup with default plugins and settings.
jss.setup(preset())

const document = window.document

const addClass = (element, name) => {
	const classes = element.className.length ? element.className.split(/\s+/) : []
	classes.push(name)
	element.className = classes.join(' ')
}

const isNode = (el) => {
	return el && el.nodeName && el.nodeType
}

const has = (object, key) => {
	return object.hasOwnProperty(key)
}

const mapObject = (object, fn) => {
	for (const key in object) {
		if (has(object, key)) {
			fn(object[key], key)
		}
	}
}

const parseClass = (string, source) => {
	let element = source

	// Our minimal parser doesn’t understand escaping CSS special
	// characters like `#`. Don’t use them. More reading:
	// https://mathiasbynens.be/notes/css-escapes .
	const parts = string.split(/([.#]?[^\s#.]+)/)
	if (/^\.|#/.test(parts[1])) {
		element = document.createElement('div')
	}

	parts.forEach((name) => {
		if (!name) {
			return
		}
		if (!element) {
			element = document.createElement(name)

			return
		}

		if (name[0] === '.') {
			addClass(element, name.substring(1))
		}

		if (name[0] === '#') {
			element.setAttribute('id', name.substring(1))
		}
	})

	return element
}

const Hydroid = (tag, config = {}) => {
	const root = isNode(tag) ? tag : parseClass(tag)

	const parseArg = (arg) => {
		if (arg === null || typeof arg === 'undefined') {
			return null
		}

		if (Array.isArray(arg)) {
			// There might be a better way to handle this...
			return arg.forEach(([ tagName, ...markup ]) => {
				root.appendChild(Hydroid(tagName, {
					markup
				}))
			})
		}

		if (typeof arg === 'string') {
			return root.appendChild(document.createTextNode(arg))
		}

		if (isNode(arg)) {
			return root.appendChild(arg)
		}

		if (
			typeof arg === 'number' ||
			typeof arg === 'boolean' ||
			arg instanceof Date ||
			arg instanceof RegExp
		) {
			return root.appendChild(document.createTextNode(arg.toString()))
		}

		if (typeof arg === 'object') {
			return mapObject(arg, (keyValue, key) => {
				if (typeof keyValue === 'function') {
					if (/^on\w+/.test(key)) {
						root.addEventListener(key.substring(2), keyValue, false)
					} else {
						// Observable
						root[key] = keyValue()
					}
				} else if (key === 'style') {
					if (typeof keyValue === 'string') {
						root.style.cssText = keyValue
					} else {
						mapObject(keyValue, (value, name) => {
							if (typeof value === 'function') {
								// Observable
								root.style.setProperty(name, value())
							}

							const match = value.match(/(.*)\W+!important\W*$/)

							if (match) {
								return root.style.setProperty(name, match[1], 'important')
							}

							return root.style.setProperty(name, value)
						})
					}
				} else if (key === 'attrs') {
					mapObject(keyValue, (value, name) => {
						root.setAttribute(name, value)
					})
				} else if (key.substr(0, 5) === 'data-') {
					root.setAttribute(key, keyValue)
				} else {
					root[key] = arg[key]
				}
			})
		}

		return null
	}

	if (config.markup) {
		if (Array.isArray(config.markup)) {
			for (const arg of config.markup) {
				parseArg(arg)
			}
		} else if (typeof config.markup === 'string') {
			root.appendChild(document.createTextNode(config.markup))
		}
	}

	if (config.style) {
		const className = uuid().slice(0, 8)
		const {
			classes
		} = jss.createStyleSheet({
			[className]: config.style
		}).attach()

		addClass(root, classes[className])
	}

	return root
}

export default Hydroid
