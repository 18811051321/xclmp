import { ModelEnum } from '../declarations'
import type { ModelConfig } from '../declarations'
import { OpenaiBlack, OpenaiText, OpenaiTransparent } from '@/app/components/base/icons/src/public/llm'
import { IS_CE_EDITION } from '@/config'

const config: ModelConfig = {
  key: ModelEnum.anthropic,
  item: {
    titleIcon: {
      'en': <OpenaiText className='h-5' />,
      'zh-Hans': <OpenaiText className='h-5' />,
    },
    subTitleIcon: <OpenaiBlack className='w-6 h-6' />,
    desc: {
      'en': 'Models provided by OpenAI, such as GPT-3.5-Turbo and GPT-4.',
      'zh-Hans': 'OpenAI提供的模型，例如GPT-3.5-Turbo和GPT-4。',
    },
    bgColor: 'bg-gray-200',
  },
  modal: {
    title: {
      'en': 'OpenAI',
      'zh-Hans': 'OpenAI',
    },
    icon: <OpenaiTransparent className='w-6 h-6' />,
    link: {
      href: 'https://docs.dify.ai',
      label: {
        'en': 'Get your API key from OpenAI',
        'zh-Hans': '从 OpenAI 获取 API Key',
      },
    },
    fields: [
      {
        visible: () => true,
        type: 'text',
        key: 'apiKey',
        required: true,
        obfuscated: true,
        label: {
          'en': 'API Key',
          'zh-Hans': 'API Key',
        },
        placeholder: {
          'en': 'Enter your API key here',
          'zh-Hans': '在此输入您的 API Key',
        },
      },
      ...(
        IS_CE_EDITION
          ? [{
            visible: () => true,
            type: 'text',
            key: 'customApiDomain',
            required: false,
            switch: true,
            switchKey: 'showCustomApiDomain',
            label: {
              'en': 'Custom API Domain',
              'zh-Hans': '自定义 API 域名',
            },
            placeholder: {
              'en': 'Enter your API domain, eg: https://example.com/xxx',
              'zh-Hans': '在此输入您的 API 域名，如：https://example.com/xxx',
            },
            help: {
              'en': 'You can configure your server compatible with the OpenAI API specification, or proxy mirror address',
              'zh-Hans': '可配置您的兼容 OpenAI API 规范的服务器，或者代理镜像地址',
            },
          }]
          : []
      ),
    ],
  },
}
export default config
