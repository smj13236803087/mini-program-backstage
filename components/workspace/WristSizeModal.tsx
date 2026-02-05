'use client'

import { useState } from 'react'

export type WearingStyle = 'single' | 'double'

interface WristSizeModalProps {
  isOpen: boolean
  onComplete: (wristSize: number, wearingStyle: WearingStyle) => void
}

export default function WristSizeModal({
  isOpen,
  onComplete,
}: WristSizeModalProps) {
  // 用字符串作为输入框状态，允许用户“全删掉再输入”
  const [wristSizeInput, setWristSizeInput] = useState<string>('16')
  const [wearingStyle, setWearingStyle] = useState<WearingStyle>('single')
  const [error, setError] = useState<string>('')

  if (!isOpen) return null

  const wristSize = Number.parseFloat(wristSizeInput)
  const wristSizeValid = Number.isFinite(wristSize) && wristSize >= 14 && wristSize <= 24

  // 计算最大周长（仅在输入有效时展示）
  const maxCircumference = wristSizeValid
    ? wearingStyle === 'single'
      ? wristSize * 1.1 // 单圈：手围的1.1倍
      : wristSize * 2.2 // 双圈：手围的2.2倍
    : null

  const handleComplete = () => {
    if (!wristSizeValid) {
      setError('手围尺寸必须在14-24厘米之间')
      return
    }
    setError('')
    onComplete(wristSize, wearingStyle)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">手腕尺寸设置</h2>
        
        {/* 手围尺寸设置 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            手围尺寸（厘米）
          </label>
          <input
            type="number"
            min="14"
            max="24"
            step="0.1"
            value={wristSizeInput}
            onChange={(e) => {
              // 允许清空；输入过程中先不强校验，提交时再校验
              setWristSizeInput(e.target.value)
              setError('')
            }}
            onBlur={() => {
              // 失焦时，如果是有效数字但超出范围，提示；如果为空，不提示
              if (wristSizeInput.trim() === '') return
              const v = Number.parseFloat(wristSizeInput)
              if (!Number.isFinite(v) || v < 14 || v > 24) {
                setError('手围尺寸必须在14-24厘米之间')
              }
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">请输入14-24厘米之间的数值</p>
          {error && (
            <p className="text-sm text-red-500 mt-1">{error}</p>
          )}
        </div>

        {/* 选择戴法 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            选择戴法
          </label>
          <div className="grid grid-cols-2 gap-4">
            {/* 单圈 */}
            <button
              onClick={() => setWearingStyle('single')}
              className={`p-4 border-2 rounded-lg transition-all ${
                wearingStyle === 'single'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-800 mb-1">单圈</div>
                <div className="text-xs text-gray-500">适合日常佩戴</div>
              </div>
            </button>

            {/* 双圈 */}
            <button
              onClick={() => setWearingStyle('double')}
              className={`p-4 border-2 rounded-lg transition-all ${
                wearingStyle === 'double'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-800 mb-1">双圈</div>
                <div className="text-xs text-gray-500">适合宽松手围</div>
              </div>
            </button>
          </div>
        </div>

        {/* 最大周长显示 */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-600 mb-1">手串适合的最大周长</div>
          <div className="text-2xl font-bold text-blue-600">
            {maxCircumference === null ? '--' : maxCircumference.toFixed(1)} 厘米
          </div>
        </div>

        {/* 完成按钮 */}
        <button
          onClick={handleComplete}
          className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          完成设置
        </button>
      </div>
    </div>
  )
}
