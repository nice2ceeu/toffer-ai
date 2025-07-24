export function Userchat({ user_text = "", user_id, className = "" }) {
  return (
    <div className="flex w-full flex-col">
      <div className="max-w-[75%] self-end">
        {/* <h3 className="">{user_id}</h3> */}
        <p
          id={user_id}
          className={`${className} rounded-4xl bg-[#4a4a4a68] px-5 py-3.5 leading-5 break-words whitespace-pre-wrap text-white`}
        >
          {user_text}
        </p>
      </div>
    </div>
  );
}
