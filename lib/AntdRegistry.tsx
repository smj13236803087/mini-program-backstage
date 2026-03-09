'use client'

import React from 'react'
import { createCache, StyleProvider } from '@ant-design/cssinjs'

const cache = createCache()

const AntdRegistry = ({ children }: React.PropsWithChildren) => {
  return <StyleProvider cache={cache}>{children}</StyleProvider>
}

export default AntdRegistry

