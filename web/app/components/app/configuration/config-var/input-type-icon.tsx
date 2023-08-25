'use client'
import React from 'react'
import type { FC } from 'react'

type IInputTypeIconProps = {
  type: 'string' | 'select'
}

const IconMap = (type: IInputTypeIconProps['type']) => {
  const icons = {
    string: (
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path fillRule="evenodd" clipRule="evenodd" d="M3.52593 0.166672H8.47411C8.94367 0.166665 9.33123 0.166659 9.64692 0.192452C9.97481 0.219242 10.2762 0.276738 10.5593 0.420991C10.9984 0.644695 11.3553 1.00165 11.579 1.44069C11.7233 1.72381 11.7808 2.02522 11.8076 2.35311C11.8334 2.6688 11.8334 3.05634 11.8334 3.5259V8.47411C11.8334 8.94367 11.8334 9.33121 11.8076 9.6469C11.7808 9.97479 11.7233 10.2762 11.579 10.5593C11.3553 10.9984 10.9984 11.3553 10.5593 11.579C10.2762 11.7233 9.97481 11.7808 9.64692 11.8076C9.33123 11.8334 8.94369 11.8333 8.47413 11.8333H3.52592C3.05636 11.8333 2.66882 11.8334 2.35312 11.8076C2.02523 11.7808 1.72382 11.7233 1.44071 11.579C1.00167 11.3553 0.644711 10.9984 0.421006 10.5593C0.276753 10.2762 0.219257 9.97479 0.192468 9.6469C0.166674 9.33121 0.16668 8.94366 0.166687 8.4741V3.52591C0.16668 3.05635 0.166674 2.6688 0.192468 2.35311C0.219257 2.02522 0.276753 1.72381 0.421006 1.44069C0.644711 1.00165 1.00167 0.644695 1.44071 0.420991C1.72382 0.276738 2.02523 0.219242 2.35312 0.192452C2.66882 0.166659 3.05637 0.166665 3.52593 0.166672ZM3.08335 3.08334C3.08335 2.76117 3.34452 2.50001 3.66669 2.50001H8.33335C8.65552 2.50001 8.91669 2.76117 8.91669 3.08334C8.91669 3.4055 8.65552 3.66667 8.33335 3.66667H6.58335V8.91667C6.58335 9.23884 6.32219 9.5 6.00002 9.5C5.67785 9.5 5.41669 9.23884 5.41669 8.91667V3.66667H3.66669C3.34452 3.66667 3.08335 3.4055 3.08335 3.08334Z" fill="#98A2B3" />
      </svg>
    ),
    select: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path fillRule="evenodd" clipRule="evenodd" d="M7.48913 4.08334H3.01083C2.70334 4.08333 2.43804 4.08333 2.21955 4.10118C1.98893 4.12002 1.75955 4.16162 1.53883 4.27408C1.20955 4.44186 0.941831 4.70958 0.774053 5.03886C0.66159 5.25958 0.619989 5.48896 0.601147 5.71958C0.583295 5.93807 0.583304 6.20334 0.583313 6.51084V10.9892C0.583304 11.2967 0.583295 11.5619 0.601147 11.7804C0.619989 12.0111 0.66159 12.2404 0.774053 12.4612C0.941831 12.7904 1.20955 13.0582 1.53883 13.2259C1.75955 13.3384 1.98893 13.38 2.21955 13.3988C2.43803 13.4167 2.70329 13.4167 3.01077 13.4167H7.48912C7.7966 13.4167 8.06193 13.4167 8.28041 13.3988C8.51103 13.38 8.74041 13.3384 8.96113 13.2259C9.29041 13.0582 9.55813 12.7904 9.72591 12.4612C9.83837 12.2404 9.87997 12.0111 9.89882 11.7804C9.91667 11.5619 9.91666 11.2967 9.91665 10.9892V6.51087C9.91666 6.20336 9.91667 5.93808 9.89882 5.71958C9.87997 5.48896 9.83837 5.25958 9.72591 5.03886C9.55813 4.70958 9.29041 4.44186 8.96113 4.27408C8.74041 4.16162 8.51103 4.12002 8.28041 4.10118C8.06192 4.08333 7.79663 4.08333 7.48913 4.08334ZM7.70413 7.70416C7.93193 7.47635 7.93193 7.107 7.70413 6.8792C7.47632 6.65139 7.10697 6.65139 6.87917 6.8792L4.66665 9.09172L3.91246 8.33753C3.68465 8.10973 3.31531 8.10973 3.0875 8.33753C2.8597 8.56534 2.8597 8.93468 3.0875 9.16249L4.25417 10.3292C4.48197 10.557 4.85132 10.557 5.07913 10.3292L7.70413 7.70416Z" fill="#98A2B3" />
        <path d="M10.9891 0.583344H6.51083C6.20334 0.583334 5.93804 0.583326 5.71955 0.601177C5.48893 0.620019 5.25955 0.66162 5.03883 0.774084C4.70955 0.941862 4.44183 1.20958 4.27405 1.53886C4.16159 1.75958 4.11999 1.98896 4.10115 2.21958C4.08514 2.41545 4.08349 2.64892 4.08333 2.91669L7.51382 2.91668C7.79886 2.91662 8.10791 2.91654 8.37541 2.9384C8.67818 2.96314 9.07818 3.02436 9.49078 3.23459C10.0396 3.51422 10.4858 3.96041 10.7654 4.50922C10.9756 4.92182 11.0369 5.32182 11.0616 5.62459C11.0835 5.8921 11.0834 6.20115 11.0833 6.48619L11.0833 9.91666C11.3511 9.9165 11.5845 9.91485 11.7804 9.89885C12.011 9.88 12.2404 9.8384 12.4611 9.72594C12.7904 9.55816 13.0581 9.29045 13.2259 8.96116C13.3384 8.74044 13.38 8.51106 13.3988 8.28044C13.4167 8.06196 13.4167 7.7967 13.4166 7.48922V3.01087C13.4167 2.70339 13.4167 2.43807 13.3988 2.21958C13.38 1.98896 13.3384 1.75958 13.2259 1.53886C13.0581 1.20958 12.7904 0.941862 12.4611 0.774084C12.2404 0.66162 12.011 0.620019 11.7804 0.601177C11.5619 0.583326 11.2966 0.583334 10.9891 0.583344Z" fill="#98A2B3" />
      </svg>
    ),
  }

  return icons[type]
}

const InputTypeIcon: FC<IInputTypeIconProps> = ({
  type,
}) => {
  const Icon = IconMap(type)
  return Icon
}

export default React.memo(InputTypeIcon)
