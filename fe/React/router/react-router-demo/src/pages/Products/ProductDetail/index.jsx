import { useParams } from 'react-router-dom'

function ProductDetail() {
  const { productId } = useParams()
  return (
    <div>
      <h1>Product Detail {productId}</h1>
    </div>
  )
}

export default ProductDetail