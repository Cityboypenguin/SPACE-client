import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import useSWR from 'swr';
import { createThread, getThread, listThreads, updateThread, type ChatThread } from '../../api/thread';
import { CourseChatTab } from './CourseChatTab';
import { toUserMessage } from '../../../../lib/errorMessages';
import styles from './ThreadWorkspace.module.css';

function ThreadDialog({title, onClose, children}: {title: string; onClose: () => void; children: ReactNode}) {
 const ref = useRef<HTMLDialogElement>(null);
 const titleId = useId();
 useEffect(() => { const dialog = ref.current; dialog?.showModal(); return () => dialog?.close(); }, []);
 return <dialog ref={ref} className={styles.dialog} aria-labelledby={titleId} onCancel={(e) => {e.preventDefault(); onClose();}}>
  <header className={styles.header}><h2 id={titleId}>{title}</h2><button type="button" onClick={onClose} aria-label="閉じる">閉じる</button></header>
  {children}
 </dialog>;
}

export function ThreadWorkspace({parentRoomID, writable}: {parentRoomID: string; writable: boolean}) {
 const [params, setParams] = useSearchParams();
 const activeID = params.get('thread');
 const [mode, setMode] = useState<'list' | 'create' | null>(null);
 const [title, setTitle] = useState('');
 const [error, setError] = useState('');
 const [busy, setBusy] = useState(false);
 const [offset, setOffset] = useState(0);
 const {data: threads, error: listError, mutate: refreshList} = useSWR(mode === 'list' ? ['chat-threads', parentRoomID, offset] : null, () => listThreads(parentRoomID, offset), {refreshInterval:15000});
 const {data: thread, error: threadError, mutate: refreshThread} = useSWR(activeID ? ['chat-thread', activeID] : null, () => getThread(activeID!), {refreshInterval:10000});
 const open = (id: string) => {setMode(null); setError(''); setParams(prev => {const next = new URLSearchParams(prev); next.set('thread',id);return next;});};
 const close = () => {setError(''); setParams(prev => {const next=new URLSearchParams(prev);next.delete('thread');return next;});};
 const showCreate = () => {setTitle('');setError('');setMode('create');};
 const submit = async (e: {preventDefault():void}) => {
  e.preventDefault();if(busy || !title.trim())return;setBusy(true);setError('');
  try {const created=await createThread(parentRoomID,title.trim());open(created.roomID);await refreshList();}
  catch(e){setError(toUserMessage(e, 'スレッドの操作に失敗しました。'));}finally{setBusy(false);}
 };
 const change = async (values: {title?:string;closed?:boolean}) => {
  if(!activeID || busy)return;setBusy(true);setError('');
  try {await updateThread(activeID,values);await refreshThread();await refreshList();}
  catch(e){setError(toUserMessage(e, 'スレッドの操作に失敗しました。'));}finally{setBusy(false);}
 };
 return <>
  <div className={styles.toolbar}>
   {writable && <button type="button" onClick={showCreate}>＋ スレッドを作成</button>}
   <button type="button" onClick={() => {setMode('list');setOffset(0);setError('');}}>スレッド一覧</button>
  </div>
  {mode && <ThreadDialog title={mode==='create'?'スレッドを作成':'スレッド一覧'} onClose={() => setMode(null)}>
   {error && <p className={styles.error} role="alert">{error}</p>}
   <div className={styles.body}>
    {mode==='create' ? <form className={styles.form} onSubmit={submit}>
     <label htmlFor={`thread-title-${parentRoomID}`}>タイトル</label>
     <input id={`thread-title-${parentRoomID}`} value={title} onChange={e=>setTitle(e.target.value)} maxLength={100} required autoFocus disabled={busy} placeholder="例：課題の相談" />
     <button type="submit" disabled={busy || !title.trim()}>{busy?'作成中…':'作成して開く'}</button>
    </form> : <>
     {writable && <p><button type="button" onClick={showCreate}>＋ スレッドを作成</button></p>}
     {listError ? <p role="alert">{toUserMessage(listError, '一覧を取得できませんでした。')}</p> : !threads ? <p>読み込み中…</p> : <>
      {threads.length===0 && <p>スレッドはありません。</p>}
      <ul className={styles.list}>{threads.map((item: ChatThread)=><li key={item.roomID}><button type="button" onClick={()=>open(item.roomID)}>
       <strong>{item.title} {item.isClosed && '（クローズ）'}</strong>
       <span className={styles.meta}>{item.messageCount}件の投稿 ・ {new Date(item.lastMessageAt || item.createdAt).toLocaleString('ja-JP')}</span>
       {item.unreadCount>0 && <span className={styles.badge}>未読 {item.unreadCount}件</span>}
      </button></li>)}</ul>
      <div className={styles.actions}><button type="button" disabled={offset===0} onClick={()=>setOffset(v=>Math.max(0,v-20))}>前へ</button><button type="button" disabled={threads.length<20} onClick={()=>setOffset(v=>v+20)}>次へ</button></div>
     </>}
    </>}
   </div>
  </ThreadDialog>}
  {activeID && !mode && <ThreadDialog title={thread?.parentRoomID===parentRoomID ? thread.title : 'スレッド'} onClose={close}>
   {error && <p className={styles.error} role="alert">{error}</p>}
   {threadError ? <p className={styles.error} role="alert">{toUserMessage(threadError, 'スレッドを取得できませんでした。')}</p> : thread===undefined ? <p className={styles.body}>読み込み中…</p> : !thread || thread.parentRoomID!==parentRoomID ? <p className={styles.body}>スレッドが見つかりません。</p> : <>
    {thread.canManage && writable && <details className={styles.settings}><summary>スレッド設定</summary><div className={styles.actions}>
     <form onSubmit={e=>{e.preventDefault();const data=new FormData(e.currentTarget);void change({title:String(data.get('title'))});}}>
      <label>タイトル <input name="title" aria-label="新しいタイトル" defaultValue={thread.title} key={thread.title} maxLength={100} required disabled={busy} /></label>
      <button disabled={busy}>変更</button>
     </form>
     <button type="button" disabled={busy} onClick={()=>change({closed:!thread.isClosed})}>{thread.isClosed?'再開する':'クローズする'}</button>
    </div></details>}
    {!thread.canWrite && <p className={styles.notice}>{thread.isClosed?'このスレッドはクローズされています。':'現在このスレッドは閲覧のみ可能です。'}</p>}
    <div className={styles.chat}><CourseChatTab key={activeID} roomId={activeID} roomWritable={thread.canWrite && writable} /></div>
   </>}
  </ThreadDialog>}
 </>;
}
