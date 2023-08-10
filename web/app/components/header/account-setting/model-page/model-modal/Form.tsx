import { useEffect, useState } from 'react'
import type { FC } from 'react'
import { useContext } from 'use-context-selector'
import type { Field, FormValue, ModelModal as TModelModal } from '../declarations'
import { useValidate } from '../../key-validator/hooks'
import { ValidatingTip } from '../../key-validator/ValidateStatus'
import { validateModelProviderFn } from '../utils'
import Input from './Input'
import I18n from '@/context/i18n'

type FormProps = {
  modelModal?: TModelModal
  initValue?: FormValue
  fields: Field[]
  onChange: (v: FormValue) => void
  onValidatedError: (v: string) => void
}

const nameClassName = `
py-2 text-sm text-gray-900
`

const Form: FC<FormProps> = ({
  modelModal,
  initValue = {},
  fields,
  onChange,
  onValidatedError,
}) => {
  const { locale } = useContext(I18n)
  const [value, setValue] = useState(initValue)
  const [validate, validating, validatedStatusState] = useValidate(value)

  useEffect(() => {
    onValidatedError(validatedStatusState.message || '')
  }, [validatedStatusState, onValidatedError])

  const handleMultiFormChange = (v: FormValue) => {
    setValue(v)
    onChange(v)

    const validateKeys = (typeof modelModal?.validateKeys === 'function' ? modelModal?.validateKeys(v) : modelModal?.validateKeys) || []
    if (validateKeys.length) {
      validate({
        before: () => {
          for (let i = 0; i < validateKeys.length; i++) {
            if (!v[validateKeys[i]])
              return false
          }
          return true
        },
        run: () => {
          return validateModelProviderFn(modelModal!.key, {
            config: v,
          })
        },
      })
    }
  }

  const handleFormChange = (k: string, v: string) => {
    handleMultiFormChange({ ...value, [k]: v })
  }

  const renderField = (field: Field) => {
    const hidden = typeof field.hidden === 'function' ? field.hidden(value) : field.hidden

    if (hidden)
      return null

    if (field.type === 'text') {
      return (
        <div key={field.key} className='py-3'>
          <div className={nameClassName}>{field.label[locale]}</div>
          <Input
            field={field}
            value={value}
            onChange={handleMultiFormChange}
            validatedStatusState={validatedStatusState}
          />
          {validating && <ValidatingTip />}
        </div>
      )
    }

    if (field.type === 'radio') {
      const options = typeof field.options === 'function' ? field.options(value) : field.options
      return (
        <div key={field.key} className='py-3'>
          <div className={nameClassName}>{field.label[locale]}</div>
          <div className='grid grid-cols-3 gap-3'>
            {
              options?.map(option => (
                <div
                  className={`
                    flex items-center px-3 h-9 rounded-lg border border-gray-100 bg-gray-25 cursor-pointer
                    ${value?.[field.key] === option.key && 'bg-white border-[1.5px] border-primary-400 shadow-sm'}
                  `}
                  onClick={() => handleFormChange(field.key, option.key)}
                  key={`${field.key}-${option.key}`}
                >
                  <div className={`
                    flex justify-center items-center mr-2 w-4 h-4 border border-gray-300 rounded-full
                    ${value?.[field.key] === option.key && 'border-[5px] border-primary-600'}
                  `} />
                  <div className='text-sm text-gray-900'>{option.label[locale]}</div>
                </div>
              ))
            }
          </div>
        </div>
      )
    }
  }

  return (
    <div>
      {
        fields.map(field => renderField(field))
      }
    </div>
  )
}

export default Form
