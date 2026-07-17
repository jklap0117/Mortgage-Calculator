import { useState } from 'react'
import { templateSummary, type ScenarioTemplate } from '../lib/templates'

type PanelMode =
  | { kind: 'idle' }
  | { kind: 'naming' }
  | { kind: 'renaming'; id: string }
  | { kind: 'confirmingDelete'; id: string }

interface TemplateListProps {
  templates: ScenarioTemplate[]
  activeTemplateId: string | null
  activeModified: boolean
  onSaveNew: (name: string) => void
  onLoad: (id: string) => void
  onRename: (id: string, name: string) => void
  onDelete: (id: string) => void
  onUpdateActive: () => void
}

interface NameFormProps {
  initialName: string
  submitLabel: string
  ariaLabel: string
  onSubmit: (name: string) => void
  onCancel: () => void
}

function NameForm({ initialName, submitLabel, ariaLabel, onSubmit, onCancel }: NameFormProps) {
  const [draft, setDraft] = useState(initialName)
  const trimmed = draft.trim()

  return (
    <form
      className="templates__name-form"
      onSubmit={(e) => {
        e.preventDefault()
        if (trimmed) onSubmit(trimmed)
      }}
    >
      <div className="field__control templates__name-control">
        <input
          className="field__input"
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') onCancel()
          }}
          placeholder="e.g. Blue house on Elm St"
          aria-label={ariaLabel}
          maxLength={60}
          autoFocus
        />
      </div>
      <div className="templates__name-actions">
        <button type="submit" className="templates__pill" disabled={!trimmed}>
          {submitLabel}
        </button>
        <button type="button" className="templates__action" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  )
}

export default function TemplateList({
  templates,
  activeTemplateId,
  activeModified,
  onSaveNew,
  onLoad,
  onRename,
  onDelete,
  onUpdateActive,
}: TemplateListProps) {
  const [mode, setMode] = useState<PanelMode>({ kind: 'idle' })
  const toIdle = () => setMode({ kind: 'idle' })

  return (
    <div className="templates">
      {mode.kind === 'naming' ? (
        <NameForm
          initialName=""
          submitLabel="Save"
          ariaLabel="Template name"
          onSubmit={(name) => {
            onSaveNew(name)
            toIdle()
          }}
          onCancel={toIdle}
        />
      ) : (
        <button
          type="button"
          className="templates__pill"
          onClick={() => setMode({ kind: 'naming' })}
        >
          Save current scenario
        </button>
      )}

      {templates.length === 0 ? (
        <p className="templates__empty">
          No saved templates yet. Save the current scenario to compare homes and loan
          structures quickly.
        </p>
      ) : (
        <ul className="templates__list">
          {templates.map((template) => {
            const isActive = template.id === activeTemplateId
            const isRenaming = mode.kind === 'renaming' && mode.id === template.id
            const isConfirmingDelete =
              mode.kind === 'confirmingDelete' && mode.id === template.id

            return (
              <li key={template.id} className="templates__item">
                <div className="templates__item-header">
                  <span className="templates__name">{template.name}</span>
                  {isActive && (
                    <span className="templates__badge">
                      {activeModified ? 'Modified' : 'Active'}
                    </span>
                  )}
                </div>
                <span className="templates__summary">{templateSummary(template)}</span>

                {isRenaming ? (
                  <NameForm
                    initialName={template.name}
                    submitLabel="Rename"
                    ariaLabel={`New name for ${template.name}`}
                    onSubmit={(name) => {
                      onRename(template.id, name)
                      toIdle()
                    }}
                    onCancel={toIdle}
                  />
                ) : isConfirmingDelete ? (
                  <div className="templates__actions" role="group" aria-label="Confirm delete">
                    <span className="templates__confirm-text">Delete?</span>
                    <button
                      type="button"
                      className="templates__action templates__action--danger"
                      onClick={() => {
                        onDelete(template.id)
                        toIdle()
                      }}
                    >
                      Confirm
                    </button>
                    <button type="button" className="templates__action" onClick={toIdle}>
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="templates__actions">
                    <button
                      type="button"
                      className="templates__action"
                      onClick={() => {
                        onLoad(template.id)
                        toIdle()
                      }}
                      aria-label={`Load ${template.name}`}
                    >
                      Load
                    </button>
                    {isActive && activeModified && (
                      <button
                        type="button"
                        className="templates__action"
                        onClick={onUpdateActive}
                        aria-label={`Update ${template.name} with current inputs`}
                      >
                        Update template
                      </button>
                    )}
                    <button
                      type="button"
                      className="templates__action"
                      onClick={() => setMode({ kind: 'renaming', id: template.id })}
                      aria-label={`Rename ${template.name}`}
                    >
                      Rename
                    </button>
                    <button
                      type="button"
                      className="templates__action templates__action--danger"
                      onClick={() => setMode({ kind: 'confirmingDelete', id: template.id })}
                      aria-label={`Delete ${template.name}`}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
