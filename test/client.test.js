import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

test('client bundle registers a served-namespace Plugins item', async () => {
  let definition
  globalThis.window = {
    __ModuleLoader__: {
      load(value) {
        definition = value
      },
    },
  }
  try {
    await import('../client.js')
    const plugin = definition.factory((id) => {
      assert.equal(id, 'react')
      return {}
    })
    assert.deepEqual(plugin.inject, ['slots', 'locale', 'remote', 'remote.llm', 'remote.credentials', 'configForms'])

    const registrations = []
    const injections = []
    const slots = {
      inject(name, callback) {
        injections.push(name)
        return callback()
      },
      register(options, component) {
        registrations.push({ options, component })
        return () => {}
      },
    }
    const locale = {
      register(namespace, dictionaries) {
        assert.ok(['settings.cliProxyApi', 'llm-cliproxyapi'].includes(namespace))
        assert.deepEqual(Object.keys(dictionaries).sort(), ['en', 'zh'])
        return () => {}
      },
      bind(namespace) {
        assert.ok(['settings.cliProxyApi', 'llm-cliproxyapi'].includes(namespace))
        return (key) => key === 'description' ? namespace : key
      },
    }
    const scope = {
      getSnapshot() {
        return { status: 'loading', value: undefined, revision: undefined, writable: false }
      },
      subscribe() {
        return () => {}
      },
    }
    const configForms = {
      get(namespace) {
        assert.equal(namespace, 'llm-pi-ai')
        return scope
      },
      whileServed(namespaces, register) {
        assert.deepEqual(namespaces, ['llm-pi-ai'])
        return register(new Set(namespaces))
      },
    }
    const ctx = {
      remote: { $on() { return () => {} } },
      slots,
      locale,
      configForms,
      effect(factory) {
        return factory()
      },
    }
    plugin.apply(ctx)
    assert.deepEqual(injections, ['plugins.item'])
    assert.equal(registrations.length, 1)
    assert.equal(registrations[0].options.name, 'plugins.item')
    assert.equal(registrations[0].options.id, 'cliproxyapi')
    assert.equal(registrations[0].options.order, 30)
    assert.equal(typeof registrations[0].options.label, 'function')
    assert.equal(typeof registrations[0].options.description, 'function')
    assert.equal(registrations[0].options.description(), 'llm-cliproxyapi')
    assert.equal(typeof registrations[0].options.inject, 'function')
    assert.equal(typeof registrations[0].component, 'function')
    assert.deepEqual(registrations[0].options.inject().hooks, { scope })
  } finally {
    delete globalThis.window
  }
})

test('client follows the served pi-ai entry on the Plugins page', async () => {
  const source = await readFile(new URL('../client.js', import.meta.url), 'utf8')
  assert.doesNotMatch(source, /setInterval\s*\(/)
  assert.doesNotMatch(source, /document\./)
  assert.doesNotMatch(source, /MutationObserver/)
  assert.doesNotMatch(source, /querySelector(All)?\s*\(/)
  assert.doesNotMatch(source, /modelsHeading|configuredRows|BOOTSTRAP_ATTRIBUTE|HIDDEN_ATTRIBUTE/)
  assert.match(source, /plugins\.item/)
  assert.match(source, /SETTINGS_SUMMARY_NS/)
  assert.match(source, /ctx\.configForms/)
  assert.match(source, /configForms\.whileServed/)
  assert.match(source, /slots\.inject\(SETTINGS_SLOT/)
  assert.match(source, /const DISCOVERY_NS = 'llm-cliproxyapi'/)
  assert.match(source, /remote\.llm\.discoverModels\(DISCOVERY_NS/)
  assert.match(source, /const inject = \['slots', 'locale', 'remote', 'remote\.llm', 'remote\.credentials', 'configForms'\]/)
  assert.match(source, /label-inverse, #fff/)
  assert.match(source, /fontWeight: 600/)
  assert.match(source, /input: Array\.isArray\(model\.inputModalities\)[\s\S]*\? \[\.\.\.model\.inputModalities\][\s\S]*: \['text'\]/)
  assert.match(source, /imageCapability: '会根据模型目录中的图片能力声明自动启用图片输入。'/)
  assert.match(source, /role: 'note' }, t\('imageCapability'\)/)
  assert.match(source, /scope\.mutate\(/)
  assert.match(source, /hooks: \{ scope \}/)
  assert.doesNotMatch(source, /useSyncExternalStore/)
  assert.doesNotMatch(source, /connection\.api/)
  assert.doesNotMatch(source, /remote\.\$on\('settings\/document-updated'/)
  assert.match(source, /remote\.\$on\('credentials\/reference-updated'/)
  assert.match(source, /role: 'status'/)
})

test('saving uses the CLIProxyAPI discovery instead of the pi-ai generic listing', async () => {
  let definition
  globalThis.window = { __ModuleLoader__: { load(value) { definition = value } } }
  try {
    await import('../client.js?catalog-discovery-test')
    const states = []
    const React = {
      createElement(type, props, ...children) { return { type, props: props || {}, children } },
      useState(initial) {
        const index = states.length
        states.push(initial)
        return [initial, (value) => { states[index] = value }]
      },
      useEffect() {},
    }
    const plugin = definition.factory((id) => {
      assert.equal(id, 'react')
      return React
    })
    let component
    const listeners = new Set()
    const scope = {
      mutations: [],
      snapshot: { status: 'ready', revision: 1, writable: true, value: {} },
      getSnapshot() { return this.snapshot },
      subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener) },
      publish(profile) {
        this.snapshot = {
          ...this.snapshot, revision: this.snapshot.revision + 1,
          value: { providers: { CLIProxyAPI: profile } },
        }
        for (const listener of listeners) listener()
      },
      async mutate(ops) {
        this.mutations.push(...ops)
        this.publish(ops[0].value)
        return true
      },
    }
    const remote = {
      llm: {
        async discoverModels(namespace, request) {
          assert.equal(namespace, 'llm-cliproxyapi')
          assert.equal(request.api, 'openai-responses')
          return { ok: true, value: [{ id: 'thinking-model', name: 'Thinking Model' }] }
        },
      },
      credentials: { async describe() { return { ok: true, value: {} } } },
    }
    plugin.apply({
      remote,
      configForms: {
        get() { return scope },
        whileServed(_namespaces, register) { return register() },
      },
      locale: { bind() { return (key) => key }, register() { return () => {} } },
      slots: {
        inject(_name, register) { return register() },
        register(_options, view) { component = view; return () => {} },
      },
      effect(factory) { return factory() },
    })
    const tree = component({
      scope, remote, t: (key) => key,
      useScope: () => ({ status: 'ready', writable: true, value: {} }),
    })
    const form = tree.children.find((child) => child?.type === 'form')
    assert.ok(form)
    const submitted = form.props.onSubmit({ preventDefault() {} })
    await new Promise((resolve) => setTimeout(resolve, 0))
    assert.equal(scope.mutations.length, 1)
    assert.equal(scope.mutations[0].value.headers['x-dsh-provider-cpa-sync'].startsWith('rich:'), true)
    assert.equal(states[4].text, '')
    assert.equal(listeners.size, 1)
    scope.publish({
      ...scope.mutations[0].value,
      headers: {},
      models: [{ id: 'thinking-model', name: 'Thinking Model', input: ['text', 'image'], reasoningEfforts: { high: 'high' } }],
    })
    await submitted
    assert.equal(states[4].text, 'saved')
    assert.equal(listeners.size, 0)
  } finally {
    delete globalThis.window
  }
})

test('client uses direct remote results and writes the bootstrap through its bound scope', async () => {
  let definition
  globalThis.window = {
    __ModuleLoader__: {
      load(value) {
        definition = value
      },
    },
  }
  try {
    await import('../client.js?initial-profile-remote-test')
    const plugin = definition.factory((id) => {
      assert.equal(id, 'react')
      return {}
    })
    assert.equal(plugin.installInitialProfile, undefined)
    assert.equal(plugin.settingsTab, undefined)
  } finally {
    delete globalThis.window
  }
})
