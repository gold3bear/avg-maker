// debug_knot_detection.js
// 在浏览器控制台运行此脚本来调试knot名称检测问题

console.log('🔍 开始调试knot名称检测问题');

// 测试函数：获取当前knot名称的多种方法
function debugGetCurrentKnotName(story, label = '') {
  console.log(`\n=== ${label} ===`);
  
  try {
    // 方法1: currentPathString
    const pathString = story.state.currentPathString;
    console.log('1. currentPathString:', pathString);
    if (pathString) {
      const knotFromPath = pathString.split('.')[0];
      console.log('   → knot from path:', knotFromPath);
    }
    
    // 方法2: callStack
    if (story.state.callStack && story.state.callStack.elements) {
      console.log('2. callStack elements count:', story.state.callStack.elements.length);
      story.state.callStack.elements.forEach((element, index) => {
        console.log(`   [${index}]:`, {
          type: element.type,
          containerName: element.currentPointer?.container?.name,
          path: element.currentPointer?.container?.path?.toString()
        });
      });
      
      // 获取最顶层的元素
      if (story.state.callStack.elements.length > 0) {
        const topElement = story.state.callStack.elements[story.state.callStack.elements.length - 1];
        const containerName = topElement.currentPointer?.container?.name;
        console.log('   → top container name:', containerName);
      }
    }
    
    // 方法3: currentPointer
    if (story.state.currentPointer) {
      console.log('3. currentPointer container:', {
        name: story.state.currentPointer.container?.name,
        path: story.state.currentPointer.container?.path?.toString()
      });
    }
    
    // 方法4: 尝试其他可能的属性
    console.log('4. Other story state properties:');
    console.log('   - outputStream length:', story.state.outputStream?.length || 0);
    console.log('   - choiceThreads count:', story.state.choiceThreads?.length || 0);
    console.log('   - currentFlow:', story.state.currentFlow?.name);
    
  } catch (error) {
    console.error('调试过程中发生错误:', error);
  }
}

// 添加到window对象以便在控制台调用
window.debugKnotDetection = {
  // 调试当前故事状态
  debugCurrent: () => {
    const story = window.currentStoryForDebug; // 需要在Preview组件中设置
    if (story) {
      debugGetCurrentKnotName(story, 'Current Story State');
    } else {
      console.error('未找到story对象，请确保游戏正在运行');
    }
  },
  
  // 模拟选择执行过程的调试
  debugChoiceExecution: (choiceIndex) => {
    const story = window.currentStoryForDebug;
    if (!story) {
      console.error('未找到story对象');
      return;
    }
    
    console.log('🎯 开始调试选择执行过程');
    
    // 执行前状态
    debugGetCurrentKnotName(story, 'Before ChooseChoiceIndex');
    
    // 保存当前选择
    const choices = [...story.currentChoices];
    console.log('Available choices:', choices.map(c => c.text));
    console.log('Selected choice:', choices[choiceIndex]?.text);
    
    // 执行选择
    story.ChooseChoiceIndex(choiceIndex);
    debugGetCurrentKnotName(story, 'After ChooseChoiceIndex, Before Continue');
    
    // 执行Continue并观察变化
    let continueCount = 0;
    while (story.canContinue && continueCount < 10) { // 限制次数避免无限循环
      const line = story.Continue();
      continueCount++;
      console.log(`Continue ${continueCount}:`, line?.substring(0, 50) + '...');
      debugGetCurrentKnotName(story, `After Continue ${continueCount}`);
    }
    
    // 最终状态
    debugGetCurrentKnotName(story, 'Final State');
    console.log('New choices available:', story.currentChoices.length);
  }
};

console.log(`
🎮 调试工具已准备好！

使用方法：
1. 开始游戏并进行几步选择
2. 在控制台运行：
   - debugKnotDetection.debugCurrent() // 查看当前状态
   - debugKnotDetection.debugChoiceExecution(0) // 调试执行第一个选择

注意：需要在Preview组件中设置 window.currentStoryForDebug = story
`);