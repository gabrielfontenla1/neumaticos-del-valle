/**
 * Static verification test for chats page overflow fixes
 * This test verifies the code changes without needing a running server
 */

import fs from 'fs'
import path from 'path'

interface TestResult {
  test: string
  passed: boolean
  details: string
}

const results: TestResult[] = []

function addResult(test: string, passed: boolean, details: string) {
  results.push({ test, passed, details })
  console.log(`${passed ? '✅' : '❌'} ${test}: ${details}`)
}

// Test 1: Verify AdminLayout has height fixes
function testAdminLayoutHeightFix() {
  const filePath = path.join(process.cwd(), 'src/features/admin/components/AdminLayout.tsx')
  const content = fs.readFileSync(filePath, 'utf-8')

  // Check for h-[calc(100vh-80px)] in main tag
  const hasMainHeight = content.includes('h-[calc(100vh-80px)]')
  addResult(
    'AdminLayout main height fix',
    hasMainHeight,
    hasMainHeight
      ? 'Found h-[calc(100vh-80px)] in main element'
      : 'Missing height class in main element'
  )

  // Check for h-full in motion.div
  const hasMotionHeight = content.includes('className="h-full"') && content.includes('motion.div')
  addResult(
    'AdminLayout motion.div height',
    hasMotionHeight,
    hasMotionHeight
      ? 'Found h-full className in motion.div'
      : 'Missing h-full in motion.div'
  )
}

// Test 2: Verify ChatsPage has break-words class
function testChatsPageBreakWords() {
  const filePath = path.join(process.cwd(), 'src/app/admin/chats/page.tsx')
  const content = fs.readFileSync(filePath, 'utf-8')

  // Check for break-words in message content
  const hasBreakWords = content.includes('break-words') && content.includes('whitespace-pre-wrap')
  addResult(
    'ChatsPage break-words class',
    hasBreakWords,
    hasBreakWords
      ? 'Found break-words and whitespace-pre-wrap classes'
      : 'Missing break-words or whitespace-pre-wrap class'
  )

  // Check for min-w-0 in flex containers
  const hasMinWidth = content.includes('min-w-0')
  addResult(
    'ChatsPage min-w-0 class',
    hasMinWidth,
    hasMinWidth ? 'Found min-w-0 class for flex containers' : 'Missing min-w-0 class'
  )

  // Check for scrollAreaRef
  const hasScrollRef = content.includes('scrollAreaRef') && content.includes('useRef<HTMLDivElement>')
  addResult(
    'ChatsPage scroll ref',
    hasScrollRef,
    hasScrollRef ? 'Found scrollAreaRef implementation' : 'Missing scrollAreaRef'
  )

  // Check for improved scroll logic
  const hasScrollLogic =
    content.includes('data-radix-scroll-area-viewport') &&
    content.includes('scrollElement.scrollTop = scrollElement.scrollHeight')
  addResult(
    'ChatsPage auto-scroll fix',
    hasScrollLogic,
    hasScrollLogic
      ? 'Found improved auto-scroll implementation'
      : 'Missing improved auto-scroll logic'
  )
}

// Test 3: Verify skeleton components exist
function testSkeletonComponents() {
  const chatListPath = path.join(process.cwd(), 'src/components/skeletons/ChatListSkeleton.tsx')
  const chatMessagesPath = path.join(
    process.cwd(),
    'src/components/skeletons/ChatMessagesSkeleton.tsx'
  )
  const indexPath = path.join(process.cwd(), 'src/components/skeletons/index.ts')

  const chatListExists = fs.existsSync(chatListPath)
  addResult(
    'ChatListSkeleton exists',
    chatListExists,
    chatListExists ? 'File exists' : 'File missing'
  )

  const chatMessagesExists = fs.existsSync(chatMessagesPath)
  addResult(
    'ChatMessagesSkeleton exists',
    chatMessagesExists,
    chatMessagesExists ? 'File exists' : 'File missing'
  )

  const indexExists = fs.existsSync(indexPath)
  addResult('Skeletons index.ts exists', indexExists, indexExists ? 'File exists' : 'File missing')

  if (chatListExists) {
    const content = fs.readFileSync(chatListPath, 'utf-8')
    const hasProps = content.includes('items?:') && content.includes('number')
    addResult(
      'ChatListSkeleton has items prop',
      hasProps,
      hasProps ? 'Props defined correctly' : 'Missing items prop'
    )
  }

  if (chatMessagesExists) {
    const content = fs.readFileSync(chatMessagesPath, 'utf-8')
    const hasProps = content.includes('messages?:') && content.includes('number')
    const hasMinWidth = content.includes('min-w-0')
    addResult(
      'ChatMessagesSkeleton has messages prop',
      hasProps,
      hasProps ? 'Props defined correctly' : 'Missing messages prop'
    )
    addResult(
      'ChatMessagesSkeleton has min-w-0',
      hasMinWidth,
      hasMinWidth ? 'Found min-w-0 class' : 'Missing min-w-0 class'
    )
  }
}

// Test 4: Verify skeletons are used in ChatsPage
function testSkeletonsIntegration() {
  const filePath = path.join(process.cwd(), 'src/app/admin/chats/page.tsx')
  const content = fs.readFileSync(filePath, 'utf-8')

  const hasImport =
    content.includes("import { ChatListSkeleton, ChatMessagesSkeleton } from '@/components/skeletons'")
  addResult(
    'Skeletons imported in ChatsPage',
    hasImport,
    hasImport ? 'Import statement found' : 'Missing import statement'
  )

  const usesChatListSkeleton = content.includes('<ChatListSkeleton')
  addResult(
    'ChatListSkeleton used',
    usesChatListSkeleton,
    usesChatListSkeleton ? 'Component used in loading state' : 'Component not used'
  )

  const usesChatMessagesSkeleton = content.includes('<ChatMessagesSkeleton')
  addResult(
    'ChatMessagesSkeleton used',
    usesChatMessagesSkeleton,
    usesChatMessagesSkeleton ? 'Component used in loading state' : 'Component not used'
  )
}

// Test 5: Verify automatizaciones page cleanup
function testAutomatizacionesCleanup() {
  const filePath = path.join(process.cwd(), 'src/app/admin/ia/automatizaciones/page.tsx')
  const content = fs.readFileSync(filePath, 'utf-8')

  const usesHFull = content.includes('h-full') && !content.includes('h-[calc(100vh-64px)]')
  addResult(
    'Automatizaciones uses h-full',
    usesHFull,
    usesHFull
      ? 'Uses h-full instead of calc height'
      : 'Still using calc height or missing h-full'
  )
}

// Run all tests
console.log('\n🧪 Running Static Verification Tests for Chats Page Overflow Fix\n')
console.log('=' .repeat(70))
console.log()

testAdminLayoutHeightFix()
console.log()

testChatsPageBreakWords()
console.log()

testSkeletonComponents()
console.log()

testSkeletonsIntegration()
console.log()

testAutomatizacionesCleanup()
console.log()

// Summary
console.log('=' .repeat(70))
console.log('\n📊 Test Summary\n')

const passed = results.filter(r => r.passed).length
const failed = results.filter(r => !r.passed).length
const total = results.length

console.log(`Total Tests: ${total}`)
console.log(`✅ Passed: ${passed}`)
console.log(`❌ Failed: ${failed}`)
console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`)

if (failed > 0) {
  console.log('\n❌ Failed Tests:')
  results
    .filter(r => !r.passed)
    .forEach(r => {
      console.log(`  - ${r.test}: ${r.details}`)
    })
  process.exit(1)
} else {
  console.log('\n✅ All tests passed!')
  process.exit(0)
}
