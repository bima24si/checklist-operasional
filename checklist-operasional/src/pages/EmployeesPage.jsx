import { useState } from 'react'
import { Icon } from '../components/ui.jsx'

export default function EmployeesPage({ staff }) {
  const [query, setQuery] = useState('')
  const normalizedQuery = query.trim().toLocaleLowerCase()
  const filteredStaff = [...staff]
    .filter((person) => (
      !normalizedQuery
      || `${person.name} ${person.role} ${person.unitName}`.toLocaleLowerCase().includes(normalizedQuery)
    ))
    .sort((a, b) => a.name.localeCompare(b.name, 'id'))

  return (
    <>
      <section className="page-heading">
        <div>
          <div className="eyebrow"><span className="live-indicator" /> DIREKTORI STAF</div>
          <h1>Daftar Pegawai</h1>
          <p>Lihat pegawai yang terdaftar beserta role dan unit kerjanya.</p>
        </div>
      </section>

      <section className="panel employee-directory-panel">
        <div className="panel-header">
          <div>
            <h2>Semua pegawai</h2>
            <p>Data pegawai yang sudah memiliki profil staf.</p>
          </div>
          <span className="count-pill employee-count">{filteredStaff.length} pegawai</span>
        </div>

        <div className="activity-filters employee-directory-filters">
          <label className="search-field">
            <Icon name="search" size={16} />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari nama, role, atau unit..."
              aria-label="Cari pegawai berdasarkan nama, role, atau unit"
            />
          </label>
        </div>

        {filteredStaff.length ? (
          <div className="employee-directory-list">
            {filteredStaff.map((person) => {
              const initials = person.name
                .split(' ')
                .filter(Boolean)
                .slice(0, 2)
                .map((part) => part[0])
                .join('')
                .toUpperCase()

              return (
                <article className="employee-directory-row" key={person.id}>
                  <span className="avatar staff-avatar" aria-hidden="true">{initials}</span>
                  <div className="employee-directory-person">
                    <strong>{person.name}</strong>
                    <span>{person.role}</span>
                  </div>
                  <div className="employee-directory-unit">
                    <Icon name="building" size={15} />
                    <span>{person.unitName || 'Belum ada unit'}</span>
                  </div>
                </article>
              )
            })}
          </div>
        ) : (
          <div className="empty-state employee-directory-empty">
            <span className="empty-check"><Icon name={staff.length ? 'search' : 'profile'} size={21} /></span>
            <strong>{staff.length ? 'Pegawai tidak ditemukan' : 'Belum ada pegawai terdaftar'}</strong>
            <span>{staff.length
              ? 'Coba kata kunci pencarian yang lain.'
              : 'Pegawai akan muncul setelah profil staf mereka dibuat saat masuk pertama kali.'}</span>
          </div>
        )}
      </section>

      <footer className="page-footer"><span>BRI <span>·</span> Daftar pegawai</span><span>{staff.length} pegawai terdaftar</span></footer>
    </>
  )
}
