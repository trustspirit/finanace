export default function Spinner({ text = '불러오는 중...' }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="w-8 h-8 border-3 border-gray-200 border-t-blue-600 rounded-full animate-spin mb-3" />
      <p className="text-sm text-gray-500">{text}</p>
    </div>
  )
}
