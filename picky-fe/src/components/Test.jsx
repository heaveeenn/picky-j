import Button from './Button'
import Badge from './Badge'
import Box from './Box'

const Test = () => {
  return (
    <div className="p-8 space-y-6">
      <h1 className="text-3xl font-bold mb-8">컴포넌트 테스트</h1>
      
      {/* Button 테스트 */}
      <Box>
        <h2 className="text-xl font-semibold mb-4">Button 컴포넌트</h2>
        <div className="space-x-4">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="success">Success</Button>
          <Button variant="danger">Danger</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
        </div>
      </Box>

      {/* Badge 테스트 */}
      <Box>
        <h2 className="text-xl font-semibold mb-4">Badge 컴포넌트</h2>
        <div className="space-x-4">
          <Badge variant="default">Default</Badge>
          <Badge variant="primary">Primary</Badge>
          <Badge variant="success">Success</Badge>
          <Badge variant="warning">Warning</Badge>
          <Badge variant="danger">Danger</Badge>
          <Badge variant="info">Info</Badge>
        </div>
      </Box>

      {/* Box 테스트 */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Box 컴포넌트</h2>
        <div className="grid grid-cols-2 gap-4">
          <Box>
            <p>기본 Box</p>
          </Box>
          <Box hover onClick={() => alert('클릭!')}>
            <p>Hover Box (클릭 가능)</p>
          </Box>
        </div>
      </div>
    </div>
  )
}

export default Test