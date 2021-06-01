import React, { useEffect, useState } from "react"
import "./TableOfContents.css"

const TableOfContents = ({ headings }) => {
  const headingList = headings.map(item => {
    return {
      ...item,
      id: `#${item.value.replace(/\s+/g, "-").toLowerCase()}`,
    }
  })
  const activeId = useActiveId(headingList)

  if (headings.length === 0) return null

  return (
    <ul className="table_list">
      <h3 className="title">Table of contents</h3>
      <div className="headings">
        {headingList.map(heading => {
          const isActive = `#${activeId}` === heading.id
          const className = isActive ? "active" : ""

          if (heading.depth > 4) {
            return <div />
          }
          return (
            <li
              key={heading.id}
              style={{ marginLeft: `${heading.depth * 10}px` }}
            >
              <a href={heading.id} className={className}>
                {heading.value}
              </a>
            </li>
          )
        })}
      </div>
    </ul>
  )
}

function useActiveId(headingList) {
  const [activeId, setActiveId] = useState(``)

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
          }
        })
      },
      { rootMargin: `0% 0% -80% 0%` }
    )

    headingList.forEach(item => {
      const target = document.querySelector(item.id)
      if (!target) return
      observer.observe(target)
    })

    return () => {
      headingList.forEach(item => {
        const target = document.querySelector(item.id)
        if (!target) return
        observer.unobserve(target)
      })
    }
  }, [headingList])

  return activeId
}

export default TableOfContents
