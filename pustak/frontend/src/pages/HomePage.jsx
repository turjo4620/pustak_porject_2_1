import Hero from '../components/Hero'
import SearchBar from '../components/SearchBar'
import AuthorsMarquee from '../components/AuthorsMarquee'
import BestSellers from '../components/BestSellers'
import RankedBestsellers from '../components/RankedBestsellers'
import NewlyReleased from '../components/NewlyReleased'
import Recommendations from '../components/Recommendations'
import AuthorSpotlight from '../components/AuthorSpotlight'
import PublisherShowcase from '../components/PublisherShowcase'
import Categories from '../components/Categories'
import Reviews from '../components/Reviews'
import TopCustomers from '../components/TopCustomers'
import Newsletter from '../components/Newsletter'
import './HomePage.css'

export default function HomePage() {
  return (
    <>
      <Hero />
      <SearchBar />
      <AuthorsMarquee />
      <div className="landing-highlights">
        <RankedBestsellers />
        <TopCustomers />
      </div>
      <BestSellers />
      <NewlyReleased />
      <Recommendations />
      <AuthorSpotlight />
      <PublisherShowcase />
      <Categories />
      <Reviews />
      <Newsletter />
    </>
  )
}
