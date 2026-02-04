'use client'

import { useState } from 'react'
import { BeadCategory, AccessoryCategory } from '@/types/bracelet'
import {
  beadCategoryConfigs,
  accessoryCategoryConfigs,
  pendantConfig,
  getBeadCategoryConfig,
  getAccessoryCategoryConfig,
} from '@/lib/bead-config/beads'
import { ArrowLeft } from 'lucide-react'

interface ConfigPanelProps {
  onAddBead: (
    category: BeadCategory,
    subType: string,
    size: number,
    name: string,
    price: number,
    color: string
  ) => void
  onAddAccessory: (
    category: AccessoryCategory,
    subType: string,
    size: number,
    name: string,
    price: number,
    color: string
  ) => void
  onAddPendant: () => void
}

type BeadSelectionStep = 'category' | 'subType' | 'size'
type AccessorySelectionStep = 'category' | 'subType' | 'size'

export default function ConfigPanel({
  onAddBead,
  onAddAccessory,
  onAddPendant,
}: ConfigPanelProps) {
  // 珠子选择状态
  const [beadStep, setBeadStep] = useState<BeadSelectionStep>('category')
  const [selectedBeadCategory, setSelectedBeadCategory] = useState<BeadCategory | null>(null)
  const [selectedBeadSubType, setSelectedBeadSubType] = useState<string | null>(null)

  // 配饰选择状态
  const [accessoryStep, setAccessoryStep] = useState<AccessorySelectionStep>('category')
  const [selectedAccessoryCategory, setSelectedAccessoryCategory] = useState<AccessoryCategory | null>(null)
  const [selectedAccessorySubType, setSelectedAccessorySubType] = useState<string | null>(null)

  // 重置珠子选择流程
  const resetBeadSelection = () => {
    setBeadStep('category')
    setSelectedBeadCategory(null)
    setSelectedBeadSubType(null)
  }

  // 重置配饰选择流程
  const resetAccessorySelection = () => {
    setAccessoryStep('category')
    setSelectedAccessoryCategory(null)
    setSelectedAccessorySubType(null)
  }

  // 珠子选择处理
  const handleSelectBeadCategory = (category: BeadCategory) => {
    setSelectedBeadCategory(category)
    setBeadStep('subType')
  }

  const handleSelectBeadSubType = (subTypeName: string) => {
    setSelectedBeadSubType(subTypeName)
    setBeadStep('size')
  }

  const handleSelectBeadSize = (size: number, price: number) => {
    if (!selectedBeadCategory || !selectedBeadSubType) return

    const categoryConfig = getBeadCategoryConfig(selectedBeadCategory)
    if (!categoryConfig) return

    const subTypeConfig = categoryConfig.subTypes.find(
      (st) => st.name === selectedBeadSubType
    )
    if (!subTypeConfig) return

    const name = `${subTypeConfig.name} ${size}mm`
    onAddBead(
      selectedBeadCategory,
      selectedBeadSubType,
      size,
      name,
      price,
      subTypeConfig.color
    )
    resetBeadSelection()
  }

  // 配饰选择处理
  const handleSelectAccessoryCategory = (category: AccessoryCategory) => {
    setSelectedAccessoryCategory(category)
    setAccessoryStep('subType')
  }

  const handleSelectAccessorySubType = (subTypeName: string) => {
    setSelectedAccessorySubType(subTypeName)
    setAccessoryStep('size')
  }

  const handleSelectAccessorySize = (size: number, price: number) => {
    if (!selectedAccessoryCategory || !selectedAccessorySubType) return

    const categoryConfig = getAccessoryCategoryConfig(selectedAccessoryCategory)
    if (!categoryConfig) return

    const subTypeConfig = categoryConfig.subTypes.find(
      (st) => st.name === selectedAccessorySubType
    )
    if (!subTypeConfig) return

    const name = `${subTypeConfig.name} ${size}mm`
    onAddAccessory(
      selectedAccessoryCategory,
      selectedAccessorySubType,
      size,
      name,
      price,
      subTypeConfig.color
    )
    resetAccessorySelection()
  }

  const beadCategoryConfig = selectedBeadCategory
    ? getBeadCategoryConfig(selectedBeadCategory)
    : null

  const accessoryCategoryConfig = selectedAccessoryCategory
    ? getAccessoryCategoryConfig(selectedAccessoryCategory)
    : null

  return (
    <div className="bg-white rounded-lg shadow-md p-6 space-y-6 max-h-[calc(100vh-120px)] overflow-y-auto">
      {/* 珠子 */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-800">珠子</h3>
          {beadStep !== 'category' && (
            <button
              onClick={resetBeadSelection}
              className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-700"
            >
              <ArrowLeft size={16} />
              <span>返回</span>
            </button>
          )}
        </div>

        {beadStep === 'category' && (
          <div className="grid grid-cols-3 gap-4">
            {beadCategoryConfigs.map((category) => (
              <button
                key={category.category}
                onClick={() => handleSelectBeadCategory(category.category)}
                className="flex flex-col items-center p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all group"
              >
                <div className="w-16 h-16 rounded-full mb-2 shadow-md group-hover:scale-110 transition-transform bg-gradient-to-br from-gray-300 to-gray-500" />
                <span className="text-sm font-medium text-gray-700">
                  {category.name}
                </span>
              </button>
            ))}
          </div>
        )}

        {beadStep === 'subType' && beadCategoryConfig && (
          <div>
            <p className="text-sm text-gray-500 mb-3">
              选择 {beadCategoryConfig.name} 类型
            </p>
            <div className="grid grid-cols-2 gap-3">
              {beadCategoryConfig.subTypes.map((subType) => (
                <button
                  key={subType.name}
                  onClick={() => handleSelectBeadSubType(subType.name)}
                  className="flex flex-col items-center p-3 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all group"
                >
                  <div
                    className="w-12 h-12 rounded-full mb-2 shadow-md group-hover:scale-110 transition-transform"
                    style={{ backgroundColor: subType.color }}
                  />
                  <span className="text-xs font-medium text-gray-700">
                    {subType.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {beadStep === 'size' && beadCategoryConfig && selectedBeadSubType && (
          <div>
            <p className="text-sm text-gray-500 mb-3">
              选择 {selectedBeadSubType} 尺寸
            </p>
            <div className="grid grid-cols-3 gap-3">
              {beadCategoryConfig.subTypes
                .find((st) => st.name === selectedBeadSubType)
                ?.sizes.map((sizeConfig) => (
                  <button
                    key={sizeConfig.size}
                    onClick={() =>
                      handleSelectBeadSize(
                        sizeConfig.size,
                        sizeConfig.price
                      )
                    }
                    className="flex flex-col items-center p-3 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all group"
                  >
                    <span className="text-lg font-bold text-gray-800 mb-1">
                      {sizeConfig.size}mm
                    </span>
                    <span className="text-xs text-gray-500">
                      ¥{sizeConfig.price}
                    </span>
                  </button>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* 配饰 */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-800">配饰</h3>
          {accessoryStep !== 'category' && (
            <button
              onClick={resetAccessorySelection}
              className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-700"
            >
              <ArrowLeft size={16} />
              <span>返回</span>
            </button>
          )}
        </div>

        {accessoryStep === 'category' && (
          <div className="grid grid-cols-3 gap-4">
            {accessoryCategoryConfigs.map((category) => (
              <button
                key={category.category}
                onClick={() => handleSelectAccessoryCategory(category.category)}
                className="flex flex-col items-center p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all group"
              >
                <div className="w-16 h-16 rounded-full mb-2 shadow-md group-hover:scale-110 transition-transform bg-gradient-to-br from-gray-300 to-gray-500" />
                <span className="text-sm font-medium text-gray-700">
                  {category.name}
                </span>
              </button>
            ))}
          </div>
        )}

        {accessoryStep === 'subType' && accessoryCategoryConfig && (
          <div>
            <p className="text-sm text-gray-500 mb-3">
              选择 {accessoryCategoryConfig.name} 类型
            </p>
            <div className="grid grid-cols-2 gap-3">
              {accessoryCategoryConfig.subTypes.map((subType) => (
                <button
                  key={subType.name}
                  onClick={() => handleSelectAccessorySubType(subType.name)}
                  className="flex flex-col items-center p-3 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all group"
                >
                  <div
                    className="w-12 h-12 rounded-full mb-2 shadow-md group-hover:scale-110 transition-transform"
                    style={{ backgroundColor: subType.color }}
                  />
                  <span className="text-xs font-medium text-gray-700">
                    {subType.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {accessoryStep === 'size' && accessoryCategoryConfig && selectedAccessorySubType && (
          <div>
            <p className="text-sm text-gray-500 mb-3">
              选择 {selectedAccessorySubType} 尺寸
            </p>
            <div className="grid grid-cols-3 gap-3">
              {accessoryCategoryConfig.subTypes
                .find((st) => st.name === selectedAccessorySubType)
                ?.sizes.map((sizeConfig) => (
                  <button
                    key={sizeConfig.size}
                    onClick={() =>
                      handleSelectAccessorySize(
                        sizeConfig.size,
                        sizeConfig.price
                      )
                    }
                    className="flex flex-col items-center p-3 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all group"
                  >
                    <span className="text-lg font-bold text-gray-800 mb-1">
                      {sizeConfig.size}mm
                    </span>
                    <span className="text-xs text-gray-500">
                      ¥{sizeConfig.price}
                    </span>
                  </button>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* 吊坠 */}
      <div>
        <h3 className="text-xl font-bold text-gray-800 mb-4">吊坠</h3>
        <button
          onClick={onAddPendant}
          className="w-full flex flex-col items-center p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all group"
        >
          <div
            className="w-16 h-16 rounded-full mb-2 shadow-md group-hover:scale-110 transition-transform"
            style={{ backgroundColor: pendantConfig.color }}
          />
          <span className="text-sm font-medium text-gray-700">
            {pendantConfig.name}
          </span>
          <span className="text-xs text-gray-500">¥{pendantConfig.price}</span>
        </button>
      </div>
    </div>
  )
}
