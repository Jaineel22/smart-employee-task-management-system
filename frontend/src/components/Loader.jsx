// // empty file
// const Loader = () => (
//   <div className="flex items-center justify-center min-h-[200px]">
//     <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
//   </div>
// );

// export default Loader;











const Loader = () => (
  <div className="flex flex-col items-center justify-center min-h-[320px] gap-3">
    <div className="w-9 h-9 border-[3px] border-slate-200 border-t-blue-600 rounded-full animate-spin" />
    <p className="text-xs text-slate-400 font-medium">Loading…</p>
  </div>
);

export default Loader;