export function Aichat({ ai_text = "", ai_id }) {
  return (
    <div className="flex w-full flex-col">
      <div className="max-w-[75%] self-start">
        <p
          id={ai_id}
          className="rounded-4xl bg-[#ebebeb] px-5 py-3.5 leading-5 break-words whitespace-pre-wrap text-[#1b1b1b]"
        >
          {ai_text}
        </p>
      </div>
    </div>
  );
}
