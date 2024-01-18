'use client'
import type { FC } from 'react'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import cn from 'classnames'
import { useContext } from 'use-context-selector'
import produce from 'immer'
import ChooseTool from './choose-tool'
import SettingBuiltInTool from './setting-built-in-tool'
import Panel from '@/app/components/app/configuration/base/feature-panel'
import Tooltip from '@/app/components/base/tooltip'
import { HelpCircle, InfoCircle, Trash03 } from '@/app/components/base/icons/src/vender/line/general'
import OperationBtn from '@/app/components/app/configuration/base/operation-btn'
import { ToolsActive } from '@/app/components/base/icons/src/public/header-nav/tools'
import AppIcon from '@/app/components/base/app-icon'
import Switch from '@/app/components/base/switch'
import ConfigContext from '@/context/debug-configuration'
import type { AgentTool } from '@/types/app'
import { type Collection, CollectionType } from '@/app/components/tools/types'
import { MAX_TOOLS_NUM } from '@/config'
import { AlertTriangle } from '@/app/components/base/icons/src/vender/solid/alertsAndFeedback'
import TooltipPlus from '@/app/components/base/tooltip-plus'
import { DefaultToolIcon } from '@/app/components/base/icons/src/public/other'

type AgentToolWithMoreInfo = AgentTool & { icon: any; collection?: Collection } | null
const AgentTools: FC = () => {
  const { t } = useTranslation()
  const [isShowChooseTool, setIsShowChooseTool] = useState(false)
  const { modelConfig, setModelConfig, collectionList } = useContext(ConfigContext)

  const [currentTool, setCurrentTool] = useState<AgentToolWithMoreInfo>(null)
  const [isShowSettingTool, setIsShowSettingTool] = useState(false)
  const tools = (modelConfig?.agentConfig?.tools as AgentTool[] || []).map((item) => {
    const collection = collectionList.find(collection => collection.id === item.provider_id)
    const icon = collection?.icon
    return {
      ...item,
      icon,
      collection,
    }
  })

  const handleToolSettingChange = (value: Record<string, any>) => {
    const newModelConfig = produce(modelConfig, (draft) => {
      const tool = (draft.agentConfig.tools).find((item: any) => item.provider_id === currentTool?.collection?.id && item.tool_name === currentTool?.tool_name)
      if (tool)
        (tool as AgentTool).tool_parameters = value
    })
    setModelConfig(newModelConfig)
    setIsShowSettingTool(false)
  }

  return (
    <>
      <Panel
        className="mt-4"
        noBodySpacing={tools.length === 0}
        headerIcon={
          <ToolsActive className='w-4 h-4 text-primary-500' />
        }
        title={
          <div className='flex items-center'>
            <div className='mr-1'>{t('appDebug.agent.tools.name')}</div>
            <Tooltip htmlContent={<div className='w-[180px]'>
              {t('appDebug.agent.tools.description')}
            </div>} selector='config-tools-tooltip'>
              <HelpCircle className='w-[14px] h-[14px] text-gray-400' />
            </Tooltip>
          </div>
        }
        headerRight={
          <div className='flex items-center'>
            <div className='leading-[18px] text-xs font-normal text-gray-500'>{tools.filter((item: any) => !!item.enabled).length}/{tools.length}&nbsp;{t('appDebug.agent.tools.enabled')}</div>
            {tools.length < MAX_TOOLS_NUM && (
              <>
                <div className='ml-3 mr-1 h-3.5 w-px bg-gray-200'></div>
                <OperationBtn type="add" onClick={() => {
                  setIsShowChooseTool(true)
                }} />
              </>
            )}
          </div>
        }
      >
        <div className='flex items-center flex-wrap justify-between'>
          {tools.map((item: AgentTool & { icon: any; collection?: Collection }, index) => (
            <div key={index}
              className={cn(item.isDeleted ? 'bg-white/50' : 'bg-white', (item.enabled && !item.isDeleted) && 'shadow-xs', index > 1 && 'mt-1', 'group relative flex justify-between items-center last-of-type:mb-0  pl-2.5 py-2 pr-3 w-full  rounded-lg border-[0.5px] border-gray-200 ')}
              style={{
                width: 'calc(50% - 2px)',
              }}
            >
              <div className='flex items-center'>
                {item.isDeleted
                  ? (
                    <DefaultToolIcon className='w-6 h-6' />
                  )
                  : (
                    typeof item.icon === 'string'
                      ? (
                        <div
                          className='w-6 h-6 bg-cover bg-center rounded-md'
                          style={{
                            backgroundImage: `url(${item.icon})`,
                          }}
                        ></div>
                      )
                      : (
                        <AppIcon
                          className='rounded-md'
                          size='tiny'
                          icon={item.icon?.content}
                          background={item.icon?.background}
                        />
                      ))}
                <div
                  title={item.tool_name}
                  className={cn(item.isDeleted ? 'line-through opacity-50' : 'group-hover:max-w-[70px]', 'ml-2 max-w-[200px]  leading-[18px] text-[13px] font-medium text-gray-800  truncate')}
                >
                  {item.tool_name}
                </div>
              </div>
              <div className='flex items-center'>
                {item.isDeleted
                  ? (
                    <div className='flex items-center'>
                      <TooltipPlus
                        popupContent={t('tools.toolRemoved')}
                      >
                        <div className='mr-1 p-1 rounded-md hover:bg-black/5  cursor-pointer'>
                          <AlertTriangle className='w-4 h-4 text-[#F79009]' />
                        </div>
                      </TooltipPlus>

                      <div className='p-1 rounded-md hover:bg-black/5 cursor-pointer' onClick={() => {
                        const newModelConfig = produce(modelConfig, (draft) => {
                          draft.agentConfig.tools.splice(index, 1)
                        })
                        setModelConfig(newModelConfig)
                      }}>
                        <Trash03 className='w-4 h-4 text-gray-500' />
                      </div>
                      <div className='ml-2 mr-3 w-px h-3.5 bg-gray-200'></div>
                    </div>
                  )
                  : (
                    <div className='hidden group-hover:flex items-center'>
                      {item.provider_type === CollectionType.builtIn && (
                        <TooltipPlus
                          popupContent={t('tools.setBuiltInTools.infoAndSetting')}
                        >
                          <div className='mr-1 p-1 rounded-md hover:bg-black/5  cursor-pointer' onClick={() => {
                            setCurrentTool(item)
                            setIsShowSettingTool(true)
                          }}>
                            <InfoCircle className='w-4 h-4 text-gray-500' />
                          </div>
                        </TooltipPlus>
                      )}

                      <div className='p-1 rounded-md hover:bg-black/5 cursor-pointer' onClick={() => {
                        const newModelConfig = produce(modelConfig, (draft) => {
                          draft.agentConfig.tools.splice(index, 1)
                        })
                        setModelConfig(newModelConfig)
                      }}>
                        <Trash03 className='w-4 h-4 text-gray-500' />
                      </div>
                      <div className='ml-2 mr-3 w-px h-3.5 bg-gray-200'></div>
                    </div>
                  )}
                <div className={cn(item.isDeleted && 'opacity-50')}>
                  <Switch
                    defaultValue={item.isDeleted ? false : item.enabled}
                    disabled={item.isDeleted}
                    size='md'
                    onChange={(enabled) => {
                      const newModelConfig = produce(modelConfig, (draft) => {
                        (draft.agentConfig.tools[index] as any).enabled = enabled
                      })
                      setModelConfig(newModelConfig)
                    }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </Panel>
      {isShowChooseTool && (
        <ChooseTool
          show
          onHide={() => setIsShowChooseTool(false)}
        />
      )}
      {isShowSettingTool && (
        <SettingBuiltInTool
          toolName={currentTool?.tool_name as string}
          setting={currentTool?.tool_parameters as any}
          collection={currentTool?.collection as Collection}
          onSave={handleToolSettingChange}
          onHide={() => setIsShowSettingTool(false)}
        />)}
    </>
  )
}
export default React.memo(AgentTools)