import React, { useState, useEffect, useContext } from 'react';
import { Story } from 'inkjs';
import { ProjectContext } from '../context/ProjectContext';
import { PluginHost } from './PluginHost.tsx';

interface PreviewProps {
  /** 当前选中的 Ink 文件绝对路径 */
  filePath: string | null;
}

export const Preview: React.FC<PreviewProps> = ({ filePath }) => {
  const { plugins } = useContext(ProjectContext)!;
  const [story, setStory] = useState<Story | null>(null);
  const [output, setOutput] = useState<string[]>([]);
  const [choices, setChoices] = useState<any[]>([]);
  const [pluginCtx, setPluginCtx] = useState<{
    manifest: any;
    params?: any;
  } | null>(null);

  useEffect(() => {
    if (!filePath) return;

    setStory(null);
    setOutput([]);
    setChoices([]);
    setPluginCtx(null);

    const init = async () => {
      try {
        // 1. 读取 Ink 源码
        const source: string = await window.inkAPI.readFile(filePath);

        // 2. 编译为 JSON
        const json = await window.inkAPI.compileInk(source, false);

        // 3. 创建 inkjs Story
        const s = new Story(json);

        // 4. 绑定外部函数 runPlugin
        s.BindExternalFunction('runPlugin', (id: string, paramJson: string) => {
          const manifest = plugins.find((p) => p.id === id);
          if (manifest) {
            const params = JSON.parse(paramJson);
            setPluginCtx({ manifest, params });
          }
        });

        // 5. 执行直到无法继续，收集输出
        const newOutput: string[] = [];
        while (s.canContinue) {
          newOutput.push(s.Continue());
        }
        setStory(s);
        setOutput(newOutput);
        setChoices(s.currentChoices);
      } catch (err) {
        console.error('Preview 初始化失败:', err);
      }
    };

    init();
  }, [filePath, plugins]);

  const handleChoose = (index: number) => {
    if (!story) return;
    story.ChooseChoiceIndex(index);

    const newOutput = [...output];
    while (story.canContinue) {
      newOutput.push(story.Continue());
    }
    setOutput(newOutput);
    setChoices(story.currentChoices);
  };

  if (!filePath) {
    return (
      <div className="p-4 text-gray-500">
        请选择一个 Ink 文件以预览
      </div>
    );
  }

  if (pluginCtx) {
    return (
      <PluginHost
        plugin={pluginCtx.manifest}
        params={pluginCtx.params}
        onClose={() => setPluginCtx(null)}
      />
    );
  }

  return (
    <div className="h-full overflow-auto bg-white p-4">
      <div className="prose max-w-none space-y-2">
        {output.map((line, idx) => (
          <p key={idx}>{line}</p>
        ))}
      </div>
      {choices.length > 0 && (
        <div className="mt-4 flex flex-col space-y-2">
          {choices.map((choice, idx) => (
            <button
              key={idx}
              className="px-3 py-1 bg-blue-500 text-white rounded"
              onClick={() => handleChoose(idx)}
            >
              {choice.text}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default Preview;
