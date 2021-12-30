import {
  render, h, Fragment,
  useState, useRef, useEffect, useMemo,
  createContext, useContext
} from './h.min.js'

const style = `
html {
  margin: 1em;
}
body {
  font-family: sans-serif;
  margin: 1em auto 5em auto;
  max-width: 600px;
}
h3 {
  padding-top: 0.5em;
  border-top: 1px solid lightgrey;
}
button, input {
  font-family: sans-serif;
  font-size: 1em;
  padding: 0.25em;
}
button ~ button {
  margin-right: 0.5em;
}
.red {
  color: red;
}
.counter {
  display: inline-block;
  font-weight: bold;
  color: green;
  border: 2px solid green;
  border-radius: 0.3em;
  padding: 0.8em;
  min-width: 1.5em;
  text-align: center;
}
`

// ---- web component ----
class HookedElement extends HTMLElement {
  constructor () {
    super()
    this._shadowRoot = this.attachShadow({ mode: 'open' })
    const attrs = Object.getPrototypeOf(this).constructor.observedAttributes || []
    attrs.forEach(attr => {
      const _attr = `_${attr}`
      Object.defineProperty(this, attr, {
        get: () => this[_attr],
        set: (v) => {
          const o = this[_attr]
          this[_attr] = v
          if (this._connected_ && o !== v) this._render()
        }
      })
    })
  }

  attributeChangedCallback (name, oldValue, newValue) {
    if (oldValue !== newValue) {
      this._render()
    }
  }

  connectedCallback () {
    this._connected_ = true
    this._render()
  }

  _render () {
    this._shadowRoot.innerHTML = null
    requestAnimationFrame(() => {
      this.render()
    })
  }
}

class XCustom extends HookedElement {
  static get observedAttributes () {
    return ['options']
  }

  render () {
    render(this._shadowRoot, {}, [
      h('div', { style: { padding: '0.5em', backgroundColor: 'yellow', color: 'red' } },
        `<x-custom options='${JSON.stringify(this._options)}' />`
      )
    ])
  }
}
customElements.define('x-custom', XCustom)

function Title () {
  useEffect(() => {
    document.title = 'hooked-hyper'
  }, [])
  return null
}

// ---- samples ----
function HyperScriptSample () {
  return h(Fragment, {}, [
    h('h1', { className: 'red' }, [
      'hooked hyperscript'
    ]),
    h('p', {},
      h('strong', {}, 'Render some elements...')
    ),
    h('p', { style: { color: 'blue', textTransform: 'uppercase' } }, 'Lorem ipsum.'),
    h('p', {}, '<script>/* escaping works */</script>'),
    h('p', { style: { border: '1px solid lightgrey', color: 'grey' } }, [
      'Render web-component:',
      h('x-custom', { options: { foo: 'bar' } })
    ]),
    h('button', { onClick: () => alert('clicked'), style: { marginBottom: '1em' } }, 'Show alert')
  ])
}

/**
 * functional component with state using hooks
 * @note the component needs to be wrapped withHook
 */
function Counter (props) {
  const style = { padding: '0.8em' }
  const { initialCount, ...other } = props
  const [count, setCount] = useState(initialCount || 0)

  return h('div', {}, [
    h('button', { style, onClick: () => setCount(count - 1) }, '-'),
    h(ShowCount, { ...other, count }),
    h('button', { style, onClick: () => setCount(count + 1) }, '+')
  ])
}

function ShowCount ({ count, ...props }) {
  return h('span', props, count)
}

function UseStateSample () {
  return h(Fragment, {}, [
    h('h3', {}, 'useState hook example'),
    h(Counter, { className: 'counter' }),
    h(Counter, { className: 'counter', initialCount: 5 })
  ])
}

function UseRefSample () {
  return h(Fragment, {}, [
    h('h3', {}, 'useRef hook example'),
    h(() => {
      const ref = useRef()
      return h(Fragment, {}, [
        h('input', { ref }),
        h('button', {
          onClick: () => { ref.current.focus() }
        }, 'Focus on click')
      ])
    })
  ])
}

function UseEffectSample () {
  return h(Fragment, {}, [
    h('h3', {}, 'useEffect hook example'),
    h(() => {
      const [count, setCount] = useState(3)

      useEffect(() => {
        document.getElementById('portal').textContent = `You clicked ${count} times.`
      }, [count])

      return [
        h('button', { onClick: () => setCount(count + 1) }, 'Count up'),
        h('button', { onClick: () => setCount(0) }, 'Reset')
      ]
    }),
    h('p'),
    h('div', { id: 'portal', style: { border: '1px solid black', padding: '0.5em' } })
  ])
}

function UseMemoSample () {
  return h(Fragment, {}, [
    h('h3', {}, 'useMemo hook example'),
    h(() => {
      const [count, setCount] = useState(0)

      const memo = useMemo(() => {
        return count
      }, [count % 5 === 0])

      return [
        h('div', {}, 'Count: ' + count),
        h('div', { style: { paddingBottom: '1em' } }, 'Memo: ' + memo),
        h('button', { onClick: () => setCount(count + 1) }, 'Count up'),
        h('button', { onClick: () => setCount(0) }, 'Reset')
      ]
    })
  ])
}

function UseContextSample () {
  const ThemeContext = createContext()

  const ThemeToggleProvider = ({ children }) => {
    const theme = [
      { color: 'blue', backgroundColor: 'cyan', padding: '0.5em' },
      { color: 'cyan', backgroundColor: 'blue', padding: '0.5em' }
    ]
    const [themeIndex, _setTheme] = useState(0)

    const setTheme = () => {
      const i = (themeIndex + 1) % theme.length
      _setTheme(i)
    }
    const value = { style: theme[themeIndex], setTheme }

    return h(ThemeContext.Provider, { value }, children)
  }

  return h(Fragment, {}, [
    h('h3', {}, 'useContext sample'),
    h(ThemeContext.Provider, { value: { style: { color: 'red', backgroundColor: 'yellow', padding: '1em' } } }, [
      h('section', {}, [
        h('div', {}, [
          h(ThemeContext.Consumer, {}, [
            h((props) => {
              return h('p', props, 'Overwrite theme. Won\'t toggle.')
            })
          ])
        ]),

        h(ThemeToggleProvider, {}, [
          h('div', {}, [
            h('div', { style: { border: '3px solid magenta' } }, [
              h(ThemeContext.Consumer, {}, [
                h(props => {
                  return h('div', props, [
                    'With ThemeContext.Consumer,',
                    h('br'),
                    'wrapped in other element.'
                  ])
                })
              ])
            ]),
            h(() => {
              const { setTheme, ...props } = useContext(ThemeContext)
              return [
                h('p', props, 'With useContext'),
                h('button', { onClick: setTheme }, 'Toggle theme')
              ]
            })
          ])
        ])
      ])
    ])
  ])
}

function Github () {
  const border = '1px solid lightgrey'

  return h('section', { style: { borderTop: border, borderBottom: border, margin: '1em 0', padding: '0 0 1em' } }, [
    h('p', {}, [
      'Check the code on ',
      h('a', { href: 'https://github.com/commenthol/hooked-hyper', target: '_blank' }, 'github'),
      '.'
    ]),
    h('iframe', {
      src: 'https://ghbtns.com/github-btn.html?user=commenthol&repo=hooked-hyper&type=star&count=true',
      frameBorder: '0',
      scrolling: '0',
      width: '170px',
      height: '20px'
    })
  ])
}

render(document.body, {}, [
  h('style', {}, style),
  h(Title),
  h(HyperScriptSample),
  h(UseStateSample),
  h(UseRefSample),
  h(UseEffectSample),
  h(UseMemoSample),
  h(UseContextSample),
  h(Github)
])
