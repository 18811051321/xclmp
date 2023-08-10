import { ModelEnum } from '../declarations'
import type { ModelConfig } from '../declarations'
import { Chatglm, ChatglmText } from '@/app/components/base/icons/src/public/llm'

const config: ModelConfig = {
  item: {
    key: ModelEnum.chatglm,
    titleIcon: {
      'en': <ChatglmText className='h-6' />,
      'zh-Hans': <ChatglmText className='h-6' />,
    },
    disable: {
      tip: {
        'en': 'Only supports the ',
        'zh-Hans': '仅支持',
      },
      link: {
        href: {
          'en': 'https://docs.dify.ai/getting-started/install-self-hosted',
          'zh-Hans': 'https://docs.dify.ai/v/zh-hans/getting-started/install-self-hosted',
        },
        label: {
          'en': 'community open-source version',
          'zh-Hans': '社区开源版本',
        },
      },
    },
  },
  modal: {
    key: ModelEnum.chatglm,
    title: {
      'en': 'ChatGLM',
      'zh-Hans': 'ChatGLM',
    },
    icon: <Chatglm className='h-6' />,
    link: {
      href: 'https://docs.dify.ai',
      label: {
        'en': 'How to deploy ChatGLM',
        'zh-Hans': '如何部署 ChatGLM',
      },
    },
    fields: [
      {
        type: 'text',
        key: 'customApiDomain',
        required: true,
        label: {
          'en': 'Custom API Domain',
          'zh-Hans': '自定义 API 域名',
        },
        placeholder: {
          'en': 'Enter your API domain, eg: https://example.com/xxx',
          'zh-Hans': '在此输入您的 API 域名，如：https://example.com/xxx',
        },
      },
    ],
  },
}

export default config
