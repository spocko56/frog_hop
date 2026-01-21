import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db';
import { useSwipeable } from 'react-swipeable';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, FastForward, Plus, Moon, Sun } from 'lucide-react';

// --- Splash Screen (With Emoji) ---
const SplashScreen = ({ onFinish }) => {
  useEffect(() => {
    const timer = setTimeout(onFinish, 2000);
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div className="fixed inset-0 bg-[#E8F5E9] flex flex-col items-center justify-center z-50">
      <div className="text-8xl mb-4 animate-bounce">🐸</div>
      <h1 className="text-4xl text-[#4CAF50] font-bold" style={{ fontFamily: '"Fredoka One", cursive' }}>
        Frog Hop
      </h1>
    </div>
  );
};

// --- Task Item Component ---
const TaskItem = ({ task, onToggle, onDelete, onDuplicate, isDark }) => {
  const handlers = useSwipeable({
    onSwipedLeft: () => onDelete(),
    trackMouse: true
  });

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      {...handlers}
      className={`relative mb-3 rounded-xl overflow-hidden shadow-sm border select-none ${
        isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-100 bg-white'
      }`}
    >
      <div className="absolute inset-0 bg-red-500 flex items-center justify-end pr-4 text-white font-bold -z-10">
        <Trash2 size={20} />
      </div>

      <div className="p-4 flex items-center gap-3 bg-inherit z-10 relative transition-transform active:translate-x-[-50px]">
        <div 
          onClick={onToggle}
          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center cursor-pointer ${
            task.isCompleted ? 'bg-[#81C784] border-[#81C784]' : 'border-gray-300 dark:border-gray-500'
          }`}
        >
          {task.isCompleted && <span className="text-white text-xs">✓</span>}
        </div>

        <span className={`flex-1 text-gray-800 dark:text-gray-100 ${task.isCompleted ? 'line-through opacity-40' : ''}`}>
          {task.description}
        </span>

        <button onClick={onDuplicate} className="opacity-40 hover:opacity-100 p-2 text-[#4CAF50]">
          <FastForward size={20} />
        </button>
      </div>
    </motion.div>
  );
};

// --- Main App ---
export default function App() {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const [loading, setLoading] = useState(true);
  const [activeDay, setActiveDay] = useState("Mon");
  const [newTask, setNewTask] = useState("");
  
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  const tasks = useLiveQuery(
    () => db.tasks.where('day').equals(activeDay).toArray(),
    [activeDay]
  );

  const addTask = async (e) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    await db.tasks.add({ description: newTask, day: activeDay, isCompleted: false });
    setNewTask("");
  };

  const duplicateToNextDay = async (task) => {
    const currentIndex = days.indexOf(task.day);
    const nextIndex = (currentIndex + 1) % 7; 
    const nextDay = days[nextIndex];

    await db.tasks.add({
      description: task.description,
      day: nextDay,
      isCompleted: false 
    });
  };

  if (loading) return <SplashScreen onFinish={() => setLoading(false)} />;

  return (
    <div className={isDarkMode ? 'dark' : ''}>
      <div className="min-h-screen transition-colors duration-300 font-sans flex flex-col bg-white text-gray-900 dark:bg-gray-900 dark:text-white">
        
        {/* Header */}
        <header className="p-4 flex items-center justify-between sticky top-0 z-20 bg-white/95 dark:bg-gray-900/95 backdrop-blur shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-3xl">🐸</span>
            <h1 className="text-2xl font-bold text-[#4CAF50]" style={{ fontFamily: '"Fredoka One", cursive' }}>
              Frog Hop
            </h1>
          </div>
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)} 
            className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors"
          >
            {isDarkMode ? <Sun size={20} className="text-yellow-400"/> : <Moon size={20} className="text-gray-600"/>}
          </button>
        </header>

        {/* Tabs */}
        <div className="flex overflow-x-auto p-2 gap-2 border-b border-gray-200 dark:border-gray-800">
          {days.map(day => (
            <button
              key={day}
              onClick={() => setActiveDay(day)}
              className={`px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                activeDay === day 
                  ? 'bg-[#81C784] text-white font-bold shadow-md' 
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400'
              }`}
            >
              {day}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 pb-24">
          <AnimatePresence>
            {tasks?.map(task => (
              <TaskItem 
                key={task.id} 
                task={task} 
                onToggle={() => db.tasks.update(task.id, { isCompleted: !task.isCompleted })} 
                onDelete={() => db.tasks.delete(task.id)}
                onDuplicate={() => duplicateToNextDay(task)}
                isDark={isDarkMode}
              />
            ))}
          </AnimatePresence>
          
          {tasks?.length === 0 && (
            <div className="text-center opacity-40 mt-10 flex flex-col items-center">
              <span className="text-4xl mb-2 grayscale">🪷</span>
              <p>No hops for {activeDay}!</p>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <form onSubmit={addTask} className="p-4 border-t flex gap-2 sticky bottom-0 bg-white border-gray-100 dark:bg-gray-900 dark:border-gray-800">
          <input
            type="text"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            placeholder="New task..."
            className="flex-1 p-3 rounded-lg outline-none border 
                       bg-gray-50 border-gray-200 text-black 
                       dark:bg-gray-800 dark:border-gray-700 dark:text-white"
          />
          <button 
            type="submit" 
            className="bg-[#81C784] text-white p-3 rounded-lg hover:bg-[#66BB6A] active:scale-95 transition-all"
          >
            <Plus />
          </button>
        </form>
      </div>
    </div>
  );
}