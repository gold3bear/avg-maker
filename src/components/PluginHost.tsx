import React from 'react';

/**
 * 插件清单接口
 */
export interface PluginManifest {
  /** 唯一标识 */
  id: string;
  /** 显示名称 */
  name: string;
  /** 插件入口 HTML 路径，相对于 public 或项目根 */
  entry: string;
  /** 可选：宽度 (px) */
  width?: number;
  /** 可选：高度 (px) */
  height?: number;
}

interface PluginHostProps {
  /** 要运行的插件清单 */
  plugin: PluginManifest;
  /** 可选参数，会以查询字符串形式附加到 URL */
  params?: Record<string, string>;
  /** 关闭插件回调 */
  onClose: () => void;
}

export const PluginHost: React.FC<PluginHostProps> = ({ plugin, params, onClose }) => {
  // 构造带参数的 URL
  const url = new URL(plugin.entry, window.location.origin);
  if (params) {
    Object.entries(params).forEach(([key, val]) => url.searchParams.set(key, val));
  }

  const containerStyle = {
    width: plugin.width ?? 800,
    height: plugin.height ?? 600
  };

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div
        className="relative bg-white rounded-lg shadow-lg overflow-hidden"
        style={containerStyle}
      >
        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 z-10 p-1 bg-gray-800 text-white rounded-full hover:bg-gray-700"
        >
          ✕
        </button>

        {/* 插件页面 */}
        <iframe
          src={url.toString()}
          className="w-full h-full border-none"
          title={plugin.name}
        />
      </div>
    </div>
  );
};

export default PluginHost;
