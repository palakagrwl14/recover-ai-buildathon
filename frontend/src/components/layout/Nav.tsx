import { NavLink } from 'react-router-dom';

export function Nav() {
  return (
    <nav style={{ padding: '1rem', borderBottom: '1px solid #ccc', marginBottom: '1rem' }}>
      <ul style={{ display: 'flex', gap: '1.5rem', listStyle: 'none', margin: 0, padding: 0 }}>
        <li>
          <NavLink to="/" end>
            Dashboard
          </NavLink>
        </li>
        <li>
          <NavLink to="/cases">
            Cases
          </NavLink>
        </li>
        <li>
          <NavLink to="/policy">
            Policy
          </NavLink>
        </li>
        <li>
          <NavLink to="/history">
            History
          </NavLink>
        </li>
        <li>
          <NavLink to="/about">
            About
          </NavLink>
        </li>
      </ul>
    </nav>
  );
}

export default Nav;
