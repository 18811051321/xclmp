import type {
  FC,
  ReactElement,
} from 'react'
import {
  cloneElement,
  memo,
  useCallback,
} from 'react'
import { useTranslation } from 'react-i18next'
import NextStep from './components/next-step'
import PanelOperator from './components/panel-operator'
import {
  DescriptionInput,
  TitleInput,
} from './components/title-description-input'
import {
  XClose,
} from '@/app/components/base/icons/src/vender/line/general'
import BlockIcon from '@/app/components/workflow/block-icon'
import { useWorkflow } from '@/app/components/workflow/hooks'
import { canRunBySingle } from '@/app/components/workflow/utils'
import { GitBranch01 } from '@/app/components/base/icons/src/vender/line/development'
import { Play } from '@/app/components/base/icons/src/vender/line/mediaAndDevices'
import TooltipPlus from '@/app/components/base/tooltip-plus'
import type { Node } from '@/app/components/workflow/types'
import { BlockEnum } from '@/app/components/workflow/types'

type BasePanelProps = {
  children: ReactElement
} & Node

const BasePanel: FC<BasePanelProps> = ({
  id,
  data,
  children,
}) => {
  const { t } = useTranslation()
  const {
    handleNodeSelect,
    handleNodeDataUpdate,
  } = useWorkflow()
  const handleTitleChange = useCallback((title: string) => {
    if (!title)
      return
    handleNodeDataUpdate({ id, data: { ...data, title } })
  }, [handleNodeDataUpdate, id, data])
  const handleDescriptionChange = useCallback((desc: string) => {
    handleNodeDataUpdate({ id, data: { ...data, desc } })
  }, [handleNodeDataUpdate, id, data])

  return (
    <div className='w-[420px] h-full bg-white shadow-lg border-[0.5px] border-gray-200 rounded-2xl overflow-y-auto'>
      <div className='sticky top-0 bg-white border-b-[0.5px] border-black/5 z-10'>
        <div className='flex items-center px-4 pt-4 pb-1'>
          <BlockIcon
            className='shrink-0 mr-1'
            type={data.type}
            toolProviderId={data.provider_id}
            size='md'
          />
          <TitleInput
            value={data.title || ''}
            onChange={handleTitleChange}
          />
          <div className='shrink-0 flex items-center text-gray-500'>
            {
              canRunBySingle(data.type) && (
                <TooltipPlus
                  popupContent={t('workflow.panel.runThisStep')}
                >
                  <div
                    className='flex items-center justify-center mr-1 w-6 h-6 rounded-md hover:bg-black/5 cursor-pointer'
                    onClick={() => handleNodeDataUpdate({ id, data: { _isSingleRun: true } })}
                  >
                    <Play className='w-4 h-4 text-gray-500' />
                  </div>
                </TooltipPlus>
              )
            }
            <PanelOperator id={id} data={data} />
            <div className='mx-3 w-[1px] h-3.5 bg-gray-200' />
            <div
              className='flex items-center justify-center w-6 h-6 cursor-pointer'
              onClick={() => handleNodeSelect(id, true)}
            >
              <XClose className='w-4 h-4' />
            </div>
          </div>
        </div>
        <div className='p-2'>
          <DescriptionInput
            value={data.desc || ''}
            onChange={handleDescriptionChange}
          />
        </div>
      </div>
      <div className='py-2'>
        {cloneElement(children, { id, data })}
      </div>
      {
        data.type !== BlockEnum.End && (
          <div className='p-4 border-t-[0.5px] border-t-black/5'>
            <div className='flex items-center mb-1 text-gray-700 text-[13px] font-semibold'>
              <GitBranch01 className='mr-1 w-4 h-4' />
              {t('workflow.panel.nextStep').toLocaleUpperCase()}
            </div>
            <div className='mb-2 text-xs text-gray-400'>
              {t('workflow.panel.addNextStep')}
            </div>
            <NextStep selectedNode={{ id, data } as Node} />
          </div>
        )
      }
    </div>
  )
}

export default memo(BasePanel)
