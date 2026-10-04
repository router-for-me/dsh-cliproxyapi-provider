window.__ModuleLoader__.load({
  id: '@router-for-me/dsh-cliproxyapi-provider',
  factory: (require) => {
    var module = { exports: {} }
    var exports = module.exports
    Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' })

    const React = require('react')
    const { useEffect, useState } = React

    const PI_NS = 'llm-pi-ai'
    // The built-in pi-ai discovery cannot parse CLIProxyAPI's Codex models array.
    // Use our own catalog discovery; the server synchronizes its rich capabilities
    // (including reasoningEfforts) after the browser saves the bootstrap profile.
    const DISCOVERY_NS = 'llm-cliproxyapi'
    const CREDENTIAL_REF = 'DSH_CLIPROXY_API_KEY'
    const PROVIDER = 'CLIProxyAPI'
    const DEFAULT_BASE_URL = 'http://127.0.0.1:8317/v1'
    const PROFILE_SYNC_HEADER = 'x-dsh-provider-cpa-sync'
    const PROFILE_SYNC_TIMEOUT_MS = 30000
    const PLACEHOLDER_AUTHORIZATION = 'Bearer dsh-cliproxyapi-no-key'
    const SETTINGS_SLOT = 'plugins.item'
    const SETTINGS_TAB_ID = 'cliproxyapi'
    const SETTINGS_LOCALE_NS = 'settings.cliProxyApi'
    const SETTINGS_SUMMARY_NS = 'llm-cliproxyapi'
    const inject = ['slots', 'locale', 'remote', 'remote.llm', 'remote.credentials', 'configForms']

    const copy = {
      en: {
        tab: 'CLIProxyAPI',
        intro: 'Connect a CLIProxyAPI server and import its model catalog.',
        imageCapability: 'Image input is enabled automatically for models that advertise image support.',
        loading: 'Loading CLIProxyAPI settings…',
        unavailable: 'CLIProxyAPI settings are unavailable in this Web profile.',
        readOnly: 'Settings are read-only for this connection.',
        baseURL: 'Base URL',
        apiKey: 'API key',
        apiKeyPlaceholder: 'Optional for a keyless CLIProxyAPI server',
        apiKeyConfiguredPlaceholder: 'API key already saved',
        credentialConfiguredLabel: 'Configured',
        save: 'Save & Enable',
        saving: 'Saving…',
        saved: 'Saved. The CLIProxyAPI model catalog is synchronized.',
        syncTimeout: 'The profile was saved, but its image and reasoning capabilities have not synchronized. Check the provider refresh logs and try again.',
        saveFailed: 'Could not save the CLIProxyAPI profile. Reload settings and try again.',
        baseRequired: 'Base URL is required.',
        baseInvalid: 'Base URL must be a valid HTTP or HTTPS URL.',
        noModels: 'CLIProxyAPI returned no usable models.',
      },
      zh: {
        tab: 'CLIProxyAPI',
        intro: '连接 CLIProxyAPI 服务并导入其模型目录。',
        imageCapability: '会根据模型目录中的图片能力声明自动启用图片输入。',
        loading: '正在读取 CLIProxyAPI 设置…',
        unavailable: '当前 Web 配置中无法访问 CLIProxyAPI 设置。',
        readOnly: '当前连接的设置为只读。',
        baseURL: 'Base URL',
        apiKey: 'API Key',
        apiKeyPlaceholder: '无鉴权的 CLIProxyAPI 可留空',
        apiKeyConfiguredPlaceholder: '已保存 API Key',
        credentialConfiguredLabel: '已配置',
        save: '保存并启用',
        saving: '保存中…',
        saved: '已保存，CLIProxyAPI 模型目录已同步。',
        syncTimeout: '配置已保存，但图片与思考能力尚未同步。请检查供应商刷新日志后重试。',
        saveFailed: '无法保存 CLIProxyAPI 配置。请重新加载设置后重试。',
        baseRequired: '请填写 Base URL。',
        baseInvalid: 'Base URL 必须是有效的 HTTP 或 HTTPS 地址。',
        noModels: 'CLIProxyAPI 未返回可用模型。',
      },
    }

    const styles = {
      section: { boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '720px', padding: '24px 16px 40px', margin: '0 auto', color: 'var(--dsw-alias-label-primary)' },
      heading: { display: 'flex', flexDirection: 'column', gap: '6px' },
      title: { margin: 0, fontSize: '16px', fontWeight: 600 },
      intro: { margin: 0, color: 'var(--dsw-alias-label-secondary)', fontSize: '13px', lineHeight: 1.5 },
      form: { display: 'flex', flexDirection: 'column', gap: '16px' },
      field: { display: 'flex', flexDirection: 'column', gap: '7px' },
      label: { fontSize: '14px', fontWeight: 500 },
      labelRow: { display: 'flex', alignItems: 'center', gap: '8px' },
      credentialStatus: { color: 'var(--dsw-alias-label-secondary)', fontSize: '12px', fontWeight: 400 },
      input: { boxSizing: 'border-box', width: '100%', minHeight: '38px', border: '1px solid var(--dsw-alias-border-primary)', borderRadius: '10px', background: 'var(--dsw-alias-bg-layer-1)', color: 'var(--dsw-alias-label-primary)', padding: '8px 12px', font: 'inherit' },
      status: { margin: 0, color: 'var(--dsw-alias-label-secondary)', fontSize: '13px', lineHeight: 1.4 },
      statusError: { margin: 0, color: 'var(--dsw-alias-status-danger)', fontSize: '13px', lineHeight: 1.4 },
      actions: { display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '4px' },
      button: { cursor: 'pointer', minHeight: '38px', border: '1px solid transparent', borderRadius: '10px', background: 'var(--dsw-alias-brand-primary)', color: 'var(--dsw-alias-label-inverse, #fff)', padding: '8px 14px', font: 'inherit', fontWeight: 600 },
      buttonDisabled: { cursor: 'default', opacity: 0.75 },
    }

    function validBaseURL(value, messages) {
      if (!value) throw new Error(messages.baseRequired)
      let parsed
      try {
        parsed = new URL(value)
      } catch {
        throw new Error(messages.baseInvalid)
      }
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') throw new Error(messages.baseInvalid)
    }

    function createSyncToken() {
      return globalThis.crypto?.randomUUID?.()
        || String(Date.now()) + '-' + Math.random().toString(36).slice(2)
    }

    function bootstrapProfileOf(baseURL, models, hasCredential, syncToken) {
      return {
        displayName: PROVIDER,
        api: 'openai-responses',
        baseURL,
        models: models.map((model) => ({
          id: model.id,
          name: model.name || model.id,
          contextWindow: model.contextWindow || 262144,
          maxTokens: model.maxTokens || 32768,
          input: Array.isArray(model.inputModalities) && model.inputModalities.length
            ? [...model.inputModalities]
            : ['text'],
        })),
        defaultContextWindow: 262144,
        defaultMaxTokens: 32768,
        defaultInput: ['text'],
        headers: {
          [PROFILE_SYNC_HEADER]: 'rich:' + syncToken,
          ...(hasCredential ? {} : { authorization: PLACEHOLDER_AUTHORIZATION }),
        },
        ...(hasCredential ? { apiKeyEnv: CREDENTIAL_REF } : {}),
      }
    }

    function syncValueOf(headers) {
      const key = Object.keys(headers || {}).find((candidate) => candidate.toLowerCase() === PROFILE_SYNC_HEADER)
      return key === undefined ? undefined : String(headers[key])
    }

    function waitForProfileSynchronization(scope, baseURL, previousRevision, messages) {
      return new Promise((resolve, reject) => {
        let finished = false
        let dispose = () => {}
        let timeout
        const finish = (error) => {
          if (finished) return
          finished = true
          clearTimeout(timeout)
          dispose()
          if (error) reject(error)
          else resolve()
        }
        const inspect = () => {
          const snapshot = scope.getSnapshot()
          if (snapshot?.status !== 'ready') return
          if (Number.isInteger(previousRevision) && (!Number.isInteger(snapshot.revision) || snapshot.revision <= previousRevision)) return
          const profile = snapshot.value?.providers?.[PROVIDER]
          if (profile?.baseURL === baseURL && syncValueOf(profile.headers) === undefined) finish()
        }
        dispose = scope.subscribe(inspect)
        timeout = setTimeout(() => finish(new Error(messages.syncTimeout)), PROFILE_SYNC_TIMEOUT_MS)
        inspect()
      })
    }

    async function credentialStatusOf(remote) {
      try {
        const response = await remote.credentials.describe([CREDENTIAL_REF])
        if (!response.ok) return 'unknown'
        return response.value[CREDENTIAL_REF]?.configured === true ? 'configured' : 'missing'
      } catch {
        return 'unknown'
      }
    }

    async function installInitialProfile(remote, scope, baseURL, apiKey, messages) {
      const discovery = await remote.llm.discoverModels(DISCOVERY_NS, {
        provider: PROVIDER,
        baseURL,
        api: 'openai-responses',
        ...(apiKey ? { apiKey } : {}),
      })
      if (!discovery.ok) throw new Error(discovery.error.message)
      if (!discovery.value.length) throw new Error(messages.noModels)

      const credential = await remote.credentials.describe([CREDENTIAL_REF])
      const configured = credential.ok && credential.value[CREDENTIAL_REF]?.configured === true
      if (apiKey) {
        const saved = await remote.credentials.set(CREDENTIAL_REF, apiKey)
        if (!saved.ok) throw new Error(saved.error.message)
      }
      const previousRevision = scope.getSnapshot().revision
      const saved = await scope.mutate([{
        op: 'set',
        path: ['providers', PROVIDER],
        value: bootstrapProfileOf(baseURL, discovery.value, Boolean(apiKey || configured), createSyncToken()),
      }])
      if (!saved) throw new Error(messages.saveFailed)
      await waitForProfileSynchronization(scope, baseURL, previousRevision, messages)
    }

    function SettingsTab({ scope, remote, t, view, useScope }) {
      if (view === 'summary') return 'CLIProxyAPI model gateway'
      const snapshot = useScope((value) => value)
      const profile = snapshot?.value?.providers?.[PROVIDER]
      const [baseURL, setBaseURL] = useState(DEFAULT_BASE_URL)
      const [apiKey, setApiKey] = useState('')
      const [credentialStatus, setCredentialStatus] = useState('unknown')
      const [saving, setSaving] = useState(false)
      const [feedback, setFeedback] = useState({ text: '', error: false })
      const readOnly = snapshot?.status === 'ready' && !snapshot.writable
      const canSave = snapshot?.status === 'ready' && snapshot.writable && !saving

      useEffect(() => {
        if (snapshot?.status !== 'ready') return
        setBaseURL(typeof profile?.baseURL === 'string' && profile.baseURL.length > 0 ? profile.baseURL : DEFAULT_BASE_URL)
      }, [profile?.baseURL, snapshot?.revision, snapshot?.status])

      useEffect(() => {
        let active = true
        const refresh = async () => {
          const status = await credentialStatusOf(remote)
          if (active) setCredentialStatus(status)
        }
        void refresh()
        const dispose = remote.$on('credentials/reference-updated', (ref) => {
          if (ref === CREDENTIAL_REF) void refresh()
        })
        return () => {
          active = false
          dispose()
        }
      }, [remote])

      const submit = async (event) => {
        event.preventDefault()
        if (!canSave) return
        const nextBaseURL = baseURL.trim().replace(/\/+$/, '')
        const nextApiKey = apiKey.trim()
        setSaving(true)
        setFeedback({ text: '', error: false })
        try {
          validBaseURL(nextBaseURL, {
            baseRequired: t('baseRequired'),
            baseInvalid: t('baseInvalid'),
            noModels: t('noModels'),
          })
          await installInitialProfile(remote, scope, nextBaseURL, nextApiKey, {
            noModels: t('noModels'),
            saveFailed: t('saveFailed'),
            syncTimeout: t('syncTimeout'),
          })
          setApiKey('')
          setFeedback({ text: t('saved'), error: false })
        } catch (error) {
          setFeedback({ text: error instanceof Error ? error.message : String(error), error: true })
        } finally {
          setSaving(false)
        }
      }

      return React.createElement(
        'div', { style: styles.section, 'aria-busy': saving || snapshot?.status === 'loading' },
        React.createElement('div', { style: styles.heading },
          React.createElement('h2', { style: styles.title }, t('title')),
          React.createElement('p', { style: styles.intro }, t('intro')),
        ),
        snapshot?.status === 'unavailable'
          ? React.createElement('p', { style: styles.statusError, role: 'alert' }, t('unavailable')) : null,
        readOnly ? React.createElement('p', { style: styles.status, role: 'status' }, t('readOnly')) : null,
        snapshot?.status === 'loading' ? React.createElement('p', { style: styles.status, role: 'status' }, t('loading')) : null,
        React.createElement('form', { style: styles.form, onSubmit: submit, noValidate: true },
          React.createElement('p', { style: styles.status, role: 'note' }, t('imageCapability')),
          React.createElement('label', { style: styles.field },
            React.createElement('span', { style: styles.label }, t('baseURL')),
            React.createElement('input', { style: styles.input, type: 'url', value: baseURL, autoComplete: 'url', disabled: !canSave, onChange: (event) => setBaseURL(event.currentTarget.value) }),
          ),
          React.createElement('label', { style: styles.field },
            React.createElement('span', { style: styles.labelRow },
              React.createElement('span', { style: styles.label }, t('apiKey')),
              credentialStatus === 'configured'
                ? React.createElement('span', { style: styles.credentialStatus, role: 'status' }, t('credentialConfiguredLabel')) : null,
            ),
            React.createElement('input', { style: styles.input, type: 'password', value: apiKey, placeholder: credentialStatus === 'configured' ? t('apiKeyConfiguredPlaceholder') : t('apiKeyPlaceholder'), autoComplete: 'off', disabled: !canSave, onChange: (event) => setApiKey(event.currentTarget.value) }),
          ),
          feedback.text ? React.createElement('p', { style: feedback.error ? styles.statusError : styles.status, role: feedback.error ? 'alert' : 'status' }, feedback.text) : null,
          React.createElement('div', { style: styles.actions },
            React.createElement('button', { type: 'submit', style: canSave ? styles.button : { ...styles.button, ...styles.buttonDisabled }, disabled: !canSave }, saving ? t('saving') : t('save')),
          ),
        ),
      )
    }

    function apply(ctx) {
      const remote = ctx.remote
      const locale = ctx.locale
      const configForms = ctx.configForms
      const scope = configForms.get(PI_NS)
      const t = locale.bind(SETTINGS_LOCALE_NS)
      const pluginT = locale.bind(SETTINGS_SUMMARY_NS)

      ctx.effect(() => locale.register(SETTINGS_LOCALE_NS, copy), 'dsh-provider-cpa: dictionaries')
      ctx.effect(() => locale.register(SETTINGS_SUMMARY_NS, {
        en: { title: 'CLIProxyAPI', description: 'Connect to a CLIProxyAPI model gateway.' },
        zh: { title: 'CLIProxyAPI', description: '连接 CLIProxyAPI 模型网关。' },
      }), 'dsh-provider-cpa: Plugins page copy')
      ctx.effect(() => configForms.whileServed([PI_NS], () => ctx.slots.inject(SETTINGS_SLOT, () => ctx.slots.register({
        name: SETTINGS_SLOT,
        id: SETTINGS_TAB_ID,
        order: 30,
        label: () => pluginT('title'),
        description: () => pluginT('description'),
        locale: SETTINGS_SUMMARY_NS,
        inject: () => ({
          remote,
          scope,
          t,
          hooks: { scope },
        }),
      }, SettingsTab))), 'dsh-provider-cpa: settings page')
    }

    exports.apply = apply
    exports.inject = inject
    return module.exports
  },
})
