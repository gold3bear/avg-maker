// 许可证提示组件
import React, { useState, useEffect } from 'react';

interface LicenseNoticeProps {
  onAccept: () => void;
}

export function LicenseNotice({ onAccept }: LicenseNoticeProps) {
  const [hasAccepted, setHasAccepted] = useState(false);

  useEffect(() => {
    // 检查用户是否已经接受过许可证
    const accepted = localStorage.getItem('avg-master-license-accepted');
    if (accepted === 'true') {
      setHasAccepted(true);
      onAccept();
    }
  }, [onAccept]);

  const handleAccept = () => {
    localStorage.setItem('avg-master-license-accepted', 'true');
    setHasAccepted(true);
    onAccept();
  };

  const openLicenseFile = () => {
    // 在外部浏览器中打开许可证文件
    window.open('https://github.com/gold3bear/avg-master/blob/main/LICENSE', '_blank');
  };

  const openCommercialLicense = () => {
    window.open('mailto:license@avgmaster.com?subject=Commercial License Inquiry', '_blank');
  };

  if (hasAccepted) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            AVG Maker 许可证协议
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            欢迎使用 AVG Maker！请仔细阅读并接受我们的许可证条款。
          </p>
        </div>

        <div className="space-y-4 mb-6">
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4">
            <h3 className="font-semibold text-green-800 dark:text-green-300 mb-2">
              🆓 非商业使用 - 完全免费
            </h3>
            <ul className="text-sm text-green-700 dark:text-green-400 space-y-1">
              <li>• 个人学习和爱好项目</li>
              <li>• 教育和学术研究</li>
              <li>• 开源项目和非营利组织</li>
              <li>• 非商业性游戏创作</li>
            </ul>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
            <h3 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">
              💼 商业使用 - 需要许可证
            </h3>
            <div className="text-sm text-blue-700 dark:text-blue-400 space-y-2">
              <div className="flex justify-between">
                <span>Indie开发者许可证：</span>
                <span className="font-medium">$99/年</span>
              </div>
              <div className="flex justify-between">
                <span>专业开发者许可证：</span>
                <span className="font-medium">$299/年</span>
              </div>
              <div className="flex justify-between">
                <span>企业许可证：</span>
                <span className="font-medium">$999/年</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-800 dark:text-yellow-300">
                <strong>重要提示：</strong>如果您计划将使用本软件创作的游戏进行商业发布（如Steam、手机应用商店等），
                您需要获得商业许可证。非商业许可证不允许商业分发。
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleAccept}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            我接受非商业许可证条款
          </button>
          <button
            onClick={openCommercialLicense}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            购买商业许可证
          </button>
        </div>

        <div className="mt-4 text-center">
          <button
            onClick={openLicenseFile}
            className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 underline"
          >
            查看完整许可证条款
          </button>
        </div>
      </div>
    </div>
  );
}