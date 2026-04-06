import ProcessoForm from '@/components/ProcessoForm'

export default function NovoProcessoPage() {
  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#1a1a2e', margin: 0 }}>Novo processo</h1>
        <p style={{ color: '#64748b', marginTop: '4px', fontSize: '14px' }}>
          Preencha os dados para cadastrar um novo processo
        </p>
      </div>
      <ProcessoForm />
    </div>
  )
}
