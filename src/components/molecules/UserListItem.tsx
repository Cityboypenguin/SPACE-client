import { useNavigate } from 'react-router-dom';
import { storageUrl } from '../../lib/storage';

type SimpleUser = {
  ID: string;
  name: string;
  accountID: string;
  avatarUrl?: string | null;
};

type Props = {
  user: SimpleUser;
  actionButton?: React.ReactNode;
  basePath?: string;
};

export const UserListItem = ({ user, actionButton, basePath = '/users' }: Props) => {
  const navigate = useNavigate();

  return (
    <li style={{ display: 'flex', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #eee' }}>
      <div onClick={() => navigate(`${basePath}/${user.ID}`)} style={{ cursor: 'pointer', marginRight: '16px' }}>
        {user.avatarUrl ? (
          <img src={storageUrl(user.avatarUrl) ?? undefined} alt={user.name} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {user.name.charAt(0)}
          </div>
        )}
      </div>
      <div style={{ flexGrow: 1 }}>
        <p style={{ margin: 0, fontWeight: 'bold' }}>{user.name}</p>
        <p style={{ margin: 0, fontSize: '0.8em', color: 'gray' }}>@{user.accountID}</p>
      </div>
      {actionButton && <div>{actionButton}</div>}
    </li>
  );
};