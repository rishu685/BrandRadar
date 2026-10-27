import { Skeleton } from '@/components/ui/skeleton';
import { TableCell, TableRow } from '@/components/ui/table';

export function ReportsTableSkeleton() {
  return Array.from({ length: 6 }, (_, index) => (
    <TableRow key={index} aria-hidden='true'>
      <TableCell className='min-w-64 pl-5'>
        <div className='flex items-center gap-3'>
          <Skeleton className='size-9 shrink-0 rounded-lg' />
          <div className='flex min-w-0 flex-1 flex-col gap-2'>
            <Skeleton className='h-4 w-40 max-w-full' />
            <Skeleton className='h-3 w-28' />
          </div>
        </div>
      </TableCell>
      <TableCell className='hidden md:table-cell'>
        <Skeleton className='h-4 w-28' />
      </TableCell>
      <TableCell>
        <Skeleton className='h-7 w-24 rounded-full' />
      </TableCell>
      <TableCell className='hidden sm:table-cell'>
        <Skeleton className='h-4 w-32' />
      </TableCell>
      <TableCell className='hidden lg:table-cell'>
        <Skeleton className='h-4 w-32' />
      </TableCell>
      <TableCell className='pr-5'>
        <Skeleton className='ml-auto h-8 w-20' />
      </TableCell>
    </TableRow>
  ));
}
