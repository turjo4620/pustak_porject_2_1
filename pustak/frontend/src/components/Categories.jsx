import { useEffect, useState } from 'react'
import BookCard from './BookCard'
import SectionHeader from './SectionHeader'
import { useApp } from '../context/AppContext'
import { api } from '../api/http'
import './Categories.css'

export default function Categories() {
  const [orderedItems, setOrderedItems] = useState([])
  const [interestBooks, setInterestBooks] = useState([])
  const { authUser, wishItems } = useApp()

  useEffect(() => {
    if (!authUser) {
      setOrderedItems([])
      return
    }

    api.get('/orders')
      .then(orders => setOrderedItems(orders.flatMap(order => order.items || [])))
      .catch(() => setOrderedItems([]))
  }, [authUser])

  const categories = [...wishItems, ...orderedItems].reduce((unique, item) => {
    ;(item.categories || []).forEach((category) => {
      if (category.category_name && category.category_id && !unique.some(item => item.category_id === category.category_id)) {
        unique.push(category)
      }
    })
    return unique
  }, [])

  const categoryIds = categories.map(category => category.category_id).join(',')

  useEffect(() => {
    if (!categoryIds) {
      setInterestBooks([])
      return
    }

    Promise.all(
      categories.map(category =>
        fetch(`https://putak-porject-2-1.onrender.com/api/books/category/${category.category_id}?limit=4`)
          .then(response => response.json())
          .then(json => json.data || [])
          .catch(() => [])
      )
    ).then(results => {
      const uniqueBooks = results.flat().filter((book, index, books) =>
        books.findIndex(item => item.id === book.id) === index
      )
      setInterestBooks(uniqueBooks.slice(0, 8))
    })
  }, [categoryIds])

  if (!categories.length) return null

  return (
    <section className="categories section" aria-label="আপনার আগ্রহের বিষয়">
      <div className="container">
        <SectionHeader
          title="আপনার আগ্রহের বিষয়"
          align="center"
        />
        {interestBooks.length > 0 && (
          <div className="categories__books">
            {interestBooks.map(book => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
