// knot_detection_analysis.js
// 分析knot名称检测问题的详细测试脚本

console.log('🔬 Knot Detection Analysis Script Loading...');

// 问题分析：为什么第二步之后都是"start"？

window.knotAnalysis = {
  
  // 分析当前Story状态的详细信息
  analyzeCurrentState: () => {
    const story = window.currentStoryForDebug;
    if (!story) {
      console.error('❌ No story found. Make sure the game is running.');
      return;
    }
    
    console.log('\n🔍 === DETAILED STORY STATE ANALYSIS ===');
    
    // 1. 基本状态信息
    console.log('📊 Basic State:');
    console.log('  - canContinue:', story.canContinue);
    console.log('  - currentChoices count:', story.currentChoices.length);
    console.log('  - currentPathString:', story.state.currentPathString);
    
    // 2. CallStack详细分析
    console.log('\n📚 CallStack Analysis:');
    if (story.state.callStack && story.state.callStack.elements) {
      console.log('  - CallStack elements count:', story.state.callStack.elements.length);
      
      story.state.callStack.elements.forEach((element, index) => {
        console.log(`  [${index}] Element Analysis:`);
        console.log('    - type:', element.type);
        console.log('    - currentPointer exists:', !!element.currentPointer);
        
        if (element.currentPointer) {
          console.log('    - container exists:', !!element.currentPointer.container);
          
          if (element.currentPointer.container) {
            console.log('    - container.name:', element.currentPointer.container.name);
            console.log('    - container.path:', element.currentPointer.container.path?.toString());
            console.log('    - container.parent:', element.currentPointer.container.parent?.name);
            
            // 深度分析container属性
            const container = element.currentPointer.container;
            console.log('    - All container properties:');
            for (let prop in container) {
              if (container.hasOwnProperty(prop)) {
                console.log(`      - ${prop}:`, container[prop]);
              }
            }
          }
        }
      });
    } else {
      console.log('  ❌ No callStack found');
    }
    
    // 3. CurrentPointer分析
    console.log('\n🎯 CurrentPointer Analysis:');
    if (story.state.currentPointer) {
      console.log('  - container exists:', !!story.state.currentPointer.container);
      if (story.state.currentPointer.container) {
        console.log('  - container.name:', story.state.currentPointer.container.name);
        console.log('  - container.path:', story.state.currentPointer.container.path?.toString());
      }
    } else {
      console.log('  ❌ No currentPointer found');
    }
    
    // 4. Flow信息
    console.log('\n🌊 Flow Analysis:');
    console.log('  - currentFlow exists:', !!story.state.currentFlow);
    if (story.state.currentFlow) {
      console.log('  - currentFlow.name:', story.state.currentFlow.name);
    }
    
    // 5. 尝试获取knot名称
    console.log('\n🎯 Knot Name Detection Test:');
    const detectedName = window.knotAnalysis.testGetCurrentKnotName(story);
    console.log('  - Final detected name:', detectedName);
    
    return {
      pathString: story.state.currentPathString,
      callStackLength: story.state.callStack?.elements?.length || 0,
      detectedKnot: detectedName
    };
  },
  
  // 测试getCurrentKnotName函数的逻辑
  testGetCurrentKnotName: (story) => {
    console.log('\n🧪 Testing getCurrentKnotName Logic:');
    
    // 方法1测试: CallStack
    console.log('1️⃣ Testing CallStack method:');
    if (story.state.callStack && story.state.callStack.elements && story.state.callStack.elements.length > 0) {
      const topElement = story.state.callStack.elements[story.state.callStack.elements.length - 1];
      if (topElement && topElement.currentPointer && topElement.currentPointer.container) {
        const containerName = topElement.currentPointer.container.name;
        console.log('  - Found container name:', containerName);
        if (containerName && containerName !== 'DEFAULT_FLOW' && containerName !== '') {
          console.log('  ✅ Would return from CallStack:', containerName);
          return containerName;
        }
      }
    }
    console.log('  ❌ CallStack method failed');
    
    // 方法2测试: CurrentPointer
    console.log('2️⃣ Testing CurrentPointer method:');
    if (story.state.currentPointer && story.state.currentPointer.container) {
      const containerName = story.state.currentPointer.container.name;
      console.log('  - Found container name:', containerName);
      if (containerName && containerName !== 'DEFAULT_FLOW' && containerName !== '') {
        console.log('  ✅ Would return from CurrentPointer:', containerName);
        return containerName;
      }
    }
    console.log('  ❌ CurrentPointer method failed');
    
    // 方法3测试: PathString
    console.log('3️⃣ Testing PathString method:');
    const pathString = story.state.currentPathString;
    if (pathString && pathString !== 'null' && pathString !== '') {
      const knotName = pathString.split('.')[0];
      console.log('  - PathString:', pathString, '→ Knot:', knotName);
      if (knotName && knotName !== 'DEFAULT_FLOW' && knotName !== '') {
        console.log('  ✅ Would return from PathString:', knotName);
        return knotName;
      }
    }
    console.log('  ❌ PathString method failed');
    
    console.log('  🔄 Falling back to "start"');
    return 'start';
  },
  
  // 模拟选择执行过程的完整分析
  simulateChoiceExecution: (choiceIndex = 0) => {
    const story = window.currentStoryForDebug;
    if (!story) {
      console.error('❌ No story found');
      return;
    }
    
    if (choiceIndex >= story.currentChoices.length) {
      console.error('❌ Invalid choice index:', choiceIndex);
      return;
    }
    
    console.log('\n🎮 === SIMULATING CHOICE EXECUTION ===');
    console.log('Selected choice:', story.currentChoices[choiceIndex].text);
    
    // 步骤1: 执行前状态
    console.log('\n📸 Step 1: Before ChooseChoiceIndex');
    const beforeChoice = window.knotAnalysis.analyzeCurrentState();
    
    // 保存当前状态以便恢复
    const savedState = story.state.ToJson();
    
    try {
      // 步骤2: 执行选择
      console.log('\n⚡ Step 2: Executing ChooseChoiceIndex');
      story.ChooseChoiceIndex(choiceIndex);
      const afterChoice = window.knotAnalysis.analyzeCurrentState();
      
      // 步骤3: 执行Continue循环
      console.log('\n🔄 Step 3: Executing Continue Loop');
      let continueCount = 0;
      const maxContinues = 10;
      
      while (story.canContinue && continueCount < maxContinues) {
        console.log(`\n  Continue ${continueCount + 1}:`);
        const line = story.Continue();
        console.log('    Output:', line?.substring(0, 50) + '...');
        
        const continueState = window.knotAnalysis.analyzeCurrentState();
        console.log('    Detected knot:', continueState.detectedKnot);
        
        continueCount++;
      }
      
      // 步骤4: 最终状态
      console.log('\n🏁 Step 4: Final State After All Continues');
      const finalState = window.knotAnalysis.analyzeCurrentState();
      
      console.log('\n📋 SUMMARY:');
      console.log('  Before choice:', beforeChoice.detectedKnot);
      console.log('  After choice:', afterChoice.detectedKnot);
      console.log('  Final state:', finalState.detectedKnot);
      console.log('  Continue count:', continueCount);
      
      return {
        before: beforeChoice,
        after: afterChoice,
        final: finalState,
        continueCount
      };
      
    } finally {
      // 恢复原始状态
      try {
        story.state.LoadJson(savedState);
        console.log('\n🔄 State restored to original');
      } catch (e) {
        console.warn('⚠️ Failed to restore state:', e);
      }
    }
  },
  
  // 检查Story对象的所有可能有用的属性
  inspectStoryObject: () => {
    const story = window.currentStoryForDebug;
    if (!story) {
      console.error('❌ No story found');
      return;
    }
    
    console.log('\n🔍 === STORY OBJECT INSPECTION ===');
    
    // 检查Story根级属性
    console.log('📦 Story root properties:');
    for (let prop in story) {
      if (story.hasOwnProperty(prop)) {
        const value = story[prop];
        console.log(`  - ${prop}: ${typeof value} ${Array.isArray(value) ? `(length: ${value.length})` : ''}`);
      }
    }
    
    // 深度检查state对象
    console.log('\n🗃️ Story.state properties:');
    for (let prop in story.state) {
      if (story.state.hasOwnProperty(prop)) {
        const value = story.state[prop];
        console.log(`  - ${prop}: ${typeof value} ${Array.isArray(value) ? `(length: ${value.length})` : ''}`);
      }
    }
  }
};

console.log(`
🎮 Knot Detection Analysis Tools Ready!

Commands:
1. knotAnalysis.analyzeCurrentState() - 分析当前状态
2. knotAnalysis.simulateChoiceExecution(0) - 模拟选择执行
3. knotAnalysis.inspectStoryObject() - 检查Story对象
4. knotAnalysis.testGetCurrentKnotName(story) - 测试knot检测逻辑

Usage:
1. Start the game and make some choices
2. Run knotAnalysis.analyzeCurrentState() to see current state
3. Run knotAnalysis.simulateChoiceExecution(0) to test choice execution
`);