import { useEffect, useState } from 'react'
import BookCard from './BookCard'
import SectionHeader from './SectionHeader'
import { useApp } from '../context/AppContext'
import { api } from '../api/http'
import './Categories.css'

export default function Categories() {
  const [orderedItems, setOrderedItems] = useState([])
  const [interestBooks, setInterestBooks] = useState([])
  const { authUser, books, cartItems, wishItems } = useApp()

  useEffect(() => {
    if (!authUser) {
      setOrderedItems([])
      return
    }

    api.get('/orders')
      .then(orders => setOrderedItems(orders.flatMap(order => order.items || [])))
      .catch(() => setOrderedItems([]))
  }, [authUser])

  const sourceItems = [...cartItems, ...wishItems, ...orderedItems]
  const categories = sourceItems.reduce((unique, item) => {
    ;(item.categories || []).forEach((category) => {
      const categoryId = category.category_id ?? category.id
      if (category.category_name && categoryId != null && !unique.some(item => item.category_id === categoryId)) {
        unique.push({ ...category, category_id: categoryId })
      }
    })
    return unique
  }, [])

  const categoryIds = categories.map(category => category.category_id).join(',')
  const sourceIds = sourceItems
    .map(item => item.book_id || item.id)
    .filter(Boolean)
    .join(',')

  useEffect(() => {
    let cancelled = false

    const loadInterestBooks = async () => {
      let interestCategories = categories

      if (!interestCategories.length && sourceItems.length) {
        const books = await Promise.all(
          sourceItems
            .map(item => item.book_id || item.id)
            .filter(Boolean)
            .filter((bookId, index, ids) => ids.indexOf(bookId) === index)
            .map(bookId =>
              fetch(`https://putak-porject-2-1.onrender.com/api/books/${bookId}`)
                .then(response => response.ok ? response.json() : null)
                .catch(() => null)
            )
        )

        interestCategories = books
          .flatMap(book => book?.categories || [])
          .reduce((unique, category) => {
            const categoryId = category.category_id ?? category.id
            if (category.category_name && categoryId != null && !unique.some(item => item.category_id === categoryId)) {
              unique.push({ ...category, category_id: categoryId })
            }
            return unique
          }, [])
      }

      const results = interestCategories.length
        ? await Promise.all(
            interestCategories.map(category =>
              fetch(`https://putak-porject-2-1.onrender.com/api/books/category/${category.category_id}?limit=4`)
                .then(response => response.json())
                .then(json => json.data || [])
                .catch(() => [])
            )
          )
        : []
      const uniqueBooks = results.flat().filter((book, index, allBooks) =>
        allBooks.findIndex(item => item.id === book.id) === index
      )
      const fallbackBooks = books.length >= 4
        ? books.slice(0, 4)
        : await fetch('https://putak-porject-2-1.onrender.com/api/books/bestsellers?limit=4')
            .then(response => response.json())
            .then(json => json.data || [])
            .catch(() => [])
      const combinedBooks = [...uniqueBooks, ...fallbackBooks].filter((book, index, allBooks) =>
        allBooks.findIndex(item => item.id === book.id) === index
      )
      if (!cancelled) {
        setInterestBooks(combinedBooks.slice(0, 8))
      }
    }

    loadInterestBooks()

    return () => { cancelled = true }
  }, [categoryIds, sourceIds, books.length])

  const hasInterestBooks = interestBooks.length > 0

  return (
    <section
      className={`categories section ${hasInterestBooks ? '' : 'categories--empty'}`}
      aria-label="আপনার আগ্রহের বিষয়"
    >
      <div className="container">
        <SectionHeader
          title="আপনার আগ্রহের বিষয়"
          align="center"
        />
        {hasInterestBooks ? (
          <div className="categories__books">
            {interestBooks.map(book => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        ) : (
          <p className="categories__empty-message">
            আপনার আগ্রহের বইগুলো এখানে দেখা যাবে। কার্ট, অর্ডার বা উইশলিস্টে বই যোগ করুন।
          </p>
        )}
      </div>
    </section>
  )
}
