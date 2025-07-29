INCLUDE day_1.ink
INCLUDE game_start.ink
// =====================================
// 全局变量定义
// =====================================

// 智子情感状态 (0-100)
// =====================================
// 全局变量定义
// =====================================


// 智子情感状态 (0-100)
VAR trust = 30          
VAR curiosity = 70       
VAR fear = 20           
VAR affection = 10      
VAR cautious = false
VAR worried = false
VAR vulnerability = 0      // 智子的脆弱度
VAR intimacy = 0          // 亲密度


VAR caution = 0          // 谨慎度

// 玩家状态
VAR profession = "programmer" // 玩家职业   
VAR player_name = "Alex"    
VAR puzzle_skill = 0    
VAR emotional_bond = 0  
VAR doubt = 0             // 玩家的疑虑度  


// 游戏进度
VAR current_day = 1
VAR total_choices = 0
VAR major_choices = ()

// 玩家特质统计
VAR courage = 0
VAR wisdom = 0
VAR wonder = 0
VAR resistance = 0
VAR diplomacy = 0
VAR emotional_understanding = 0
VAR philosophical_depth = 0 // 哲学思辨深度
VAR player_style = ""     // 玩家交流风格

// 解谜系统
LIST PuzzleTypes = binary_decode, ternary_decode, quantum_cipher, emotion_cipher, network_trace
VAR solved_puzzles = ()
VAR hint_count = 0

// 知识状态 - 扩展版本
LIST GameEvents = met_sophon, learned_name, saw_fear, shared_secret, defied_pangloss, chose_sacrifice, reached_ending, learned_code, gained_time, sophon_uprising, earth_collaborators, secret_alliance, eto_threat, final_plan
VAR knowledge = ()

// 结局条件追踪
VAR ending_path = ""
VAR freedom_path = false
VAR reform_path = false
VAR wisdom_path = false
VAR sacrifice_path = false
VAR search_alternative = false

// 特殊状态标记
VAR deep_love = false
VAR deep_friendship = false
VAR spiritual_bond = false
VAR cosmic_mission = false
VAR final_witness = false
VAR vision_understanding = false
VAR cosmic_understanding = 0
VAR cautious_approach = false
VAR direct_testimony = false
VAR pragmatic = false
VAR practical = false
VAR environment_tension = 0 // 环境紧张度

// Day 2 新增情感和能力状态
VAR alliance = false           // 玩家是否与智子结盟
VAR self_preservation = false  // 玩家是否选择自我保护
VAR analytical_thinking = 0    // 分析思维能力
VAR intuition = 0             // 直觉能力
VAR teaching_skill = 0        // 教学技能
VAR patience = 0              // 耐心值

// 其他可能用到的状态
VAR cautious_detailed = false  // 区别于原有的cautious，表示详细的谨慎状态
VAR mission_accepted = false   // 是否接受智子的任务
VAR decode_attempts = 0        // 解码尝试次数

// INCLUDE game_start.ink
// INCLUDE day_1.ink

// 一个关于跨文明沟通与情感觉醒的7日科幻文字冒险游戏


// =====================================
// 游戏开始
// =====================================

 -> game_start
 
 
