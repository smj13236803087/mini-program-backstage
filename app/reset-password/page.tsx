'use client'

import React, { Suspense, useState } from 'react'
import { Form, Input, Button, Card, message } from 'antd'
import { LockOutlined } from '@ant-design/icons'
import { useRouter, useSearchParams } from 'next/navigation'
import styles from './ResetPassword.module.css'

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams?.get('token') || ''
  const [loading, setLoading] = useState(false)

  const onFinish = async (values: any) => {
    if (!token) {
      message.error('无效的重置密码链接')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: values.password }),
      })

      const data = await response.json().catch(() => null)
      if (response.ok && data?.errno === 0) {
        message.success('密码重置成功')
        router.push('/login')
      } else {
        message.error(data?.errmsg || '密码重置失败，请重试')
      }
    } catch (e) {
      console.error('reset-password error:', e)
      message.error('重置密码过程中发生错误')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      <Card title="重置密码" className={styles.card}>
        <Form name="reset-password" onFinish={onFinish} className={styles.form} layout="vertical">
          <Form.Item name="password" label="新密码" rules={[{ required: true, message: '请输入您的新密码!' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="新密码" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" className={styles.submitButton} loading={loading}>
              重置密码
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div>加载中...</div>}>
      <ResetPasswordForm />
    </Suspense>
  )
}

