'use client'

import React, { useState } from 'react'
import { Form, Input, Button, Card, message } from 'antd'
import { UserOutlined } from '@ant-design/icons'
import Link from 'next/link'
import styles from './ForgotPassword.module.css'

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false)

  const onFinish = async (values: any) => {
    setLoading(true)
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: values.email }),
      })

      const data = await response.json().catch(() => null)
      if (response.ok && data?.errno === 0) {
        message.success('重置密码邮件已发送，请检查邮箱')
      } else {
        message.error(data?.errmsg || '发送重置密码邮件失败，请重试')
      }
    } catch (e) {
      console.error('forgot-password error:', e)
      message.error('发送重置密码邮件过程中发生错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      <Card title="忘记密码" className={styles.card}>
        <Form name="forgot-password" onFinish={onFinish} className={styles.form} layout="vertical">
          <Form.Item name="email" label="邮箱" rules={[{ required: true, message: '请输入您的邮箱!' }]}>
            <Input prefix={<UserOutlined />} placeholder="邮箱" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" className={styles.submitButton} loading={loading}>
              发送重置密码邮件
            </Button>
          </Form.Item>
          <Form.Item>
            <Link href="/login">
              <Button type="link">返回登录</Button>
            </Link>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}

