import { useState } from 'react'
import type { FC } from 'react'
import { useTranslation } from 'react-i18next'
import { useContext } from 'use-context-selector'
import Indicator from '../../../indicator'
import type { ModelItem as TModelItem } from '../declarations'
import Operation from './Operation'
import s from './index.module.css'
import I18n from '@/context/i18n'
import Button from '@/app/components/base/button'
import Confirm from '@/app/components/base/confirm/common'

type ModelItemProps = {
  modelItem: TModelItem
  onOpenModal: () => void
}

const ModelItem: FC<ModelItemProps> = ({
  modelItem,
  onOpenModal,
}) => {
  const { locale } = useContext(I18n)
  const { t } = useTranslation()
  const [confirmShow, setConfirmShow] = useState(false)

  return (
    <div className='mb-2 bg-gray-50 rounded-xl'>
      <div className='flex justify-between items-center px-4 h-14'>
        {modelItem.titleIcon[locale]}
        <div className='flex items-center'>
          <div className='flex items-center'>
            📣
            <div className={`${s.vender} ml-1 mr-2 text-xs font-medium text-transparent`}>{modelItem.vender?.[locale]}</div>
            <Button
              type='primary'
              className='!px-3 !h-7 rounded-md !text-xs font-medium text-gray-700'
              onClick={onOpenModal}
            >
              Get for free
            </Button>
          </div>
          <Button
            className='!px-3 !h-7 rounded-md bg-white !text-xs font-medium text-gray-700'
            onClick={onOpenModal}
          >
            {t('common.operation.add')}
          </Button>
        </div>
        <div className='flex items-center'>
          <div></div>
          <Indicator className='mr-3' />
          <Button
            className='mr-1 !px-3 !h-7 rounded-md bg-white !text-xs font-medium text-gray-700'
            onClick={onOpenModal}
          >
            {t('common.operation.edit')}
          </Button>
          <Operation onOperate={() => setConfirmShow(true)} />
        </div>
      </div>
      <div className='px-3 pb-3'>
        <div className='flex mb-1 px-3 py-2 bg-white rounded-lg shadow-xs last:mb-0'>
          <div className='grow'>
            <div className='flex items-center mb-0.5 h-[18px] text-[13px] font-medium text-gray-700'>
              al6z-infra/llama136-v2-chat
              <div className='ml-2 px-1.5 rounded-md border border-[rgba(0,0,0,0.08)] text-xs text-gray-600'>Embeddings</div>
            </div>
            <div className='text-xs text-gray-500'>version: d7769041994d94e96ad9d568eac12laecf50684a060963625a41c4006126985</div>
          </div>
          <div className='flex items-center'>
            <Indicator className='mr-3' />
            <Button
              className='mr-1 !px-3 !h-7 rounded-md bg-white !text-xs font-medium text-gray-700'
              onClick={onOpenModal}
            >
              {t('common.operation.edit')}
            </Button>
            <Operation onOperate={() => setConfirmShow(true)} />
          </div>
        </div>
        <div className='flex mb-1 px-3 py-2 bg-white rounded-lg shadow-xs last:mb-0'>
          <div className='grow'>
            <div className='flex items-center mb-0.5 h-[18px] text-[13px] font-medium text-gray-700'>
              al6z-infra/llama136-v2-chat
              <div className='ml-2 px-1.5 rounded-md border border-[rgba(0,0,0,0.08)] text-xs text-gray-600'>Embeddings</div>
            </div>
            <div className='text-xs text-gray-500'>version: d7769041994d94e96ad9d568eac12laecf50684a060963625a41c4006126985</div>
          </div>
          <div className='flex items-center'>
            <Indicator className='mr-3' />
            <Button
              className='mr-1 !px-3 !h-7 rounded-md bg-white !text-xs font-medium text-gray-700'
              onClick={onOpenModal}
            >
              {t('common.operation.edit')}
            </Button>
            <Operation onOperate={() => setConfirmShow(true)} />
          </div>
        </div>
      </div>
      <Confirm
        isShow={confirmShow}
        onCancel={() => setConfirmShow(false)}
        title='xxxx-xxx'
        desc='xxxxx'
      />
    </div>
  )
}

export default ModelItem
