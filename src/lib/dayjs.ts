import dayjs from 'dayjs'
import timezone from 'dayjs/plugin/timezone'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(timezone)
dayjs.extend(relativeTime)

export default dayjs
