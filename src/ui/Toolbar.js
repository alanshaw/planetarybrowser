import React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { setTabSearch, setTabUrl, selectSelectedTab } from './redux/slices/tabs'
import { selectPeersList } from './redux/slices/peers'
import isIpfs from 'is-ipfs'
import CID from 'cids'
import BackButton from './BackButton'
import ForwardButton from './ForwardButton'

export function Toolbar () {
  const tab = useSelector(selectSelectedTab)
  const peers = useSelector(selectPeersList)
  const dispatch = useDispatch()

  if (!tab) return null

  const onSubmit = e => {
    e.preventDefault()
    let search = tab.search
    let url

    if (isIpfs.cid(search)) {
      url = `ipfs://${search}`
      search = `/ipfs/${search}`
    } else if (isIpfs.ipfsPath(search)) {
      url = `ipfs://${search.replace('/ipfs/', '')}`
    } else if (isIpfs.cidPath(search)) {
      url = `ipfs://${search.replace('/ipfs/', '')}`
      search = search.startsWith('/ipfs/') ? search : `/ipfs/${search}`
    } else {
      try {
        new URL(tab.search) // eslint-disable-line no-new
        url = tab.search
      } catch (err) {
        try {
          if (!tab.search.includes('.')) throw new Error('probably not a HTTPS URL')
          url = search = new URL(`https://${tab.search}`).toString()
        } catch (err) {
          // TODO: custom search engine
          url = search = `https://duckduckgo.com/?q=${encodeURIComponent(tab.search)}`
        }
      }
    }

    // Convert any non-base32 CID
    if (url.startsWith('ipfs://')) {
      const [,, cid, ...pathParts] = url.split('/')
      try {
        url = `ipfs://${new CID(cid).toV1().toString('base32')}${pathParts.length ? '/' + pathParts.join('/') : ''}`
      } catch (err) {
        // TODO: custom search engine
        url = search = `https://duckduckgo.com/?q=${encodeURIComponent(tab.search)}`
      }
    }

    if (search !== tab.search) {
      dispatch(setTabSearch({ tabId: tab.id, value: search }))
    }

    dispatch(setTabUrl({ tabId: tab.id, value: url }))
  }

  return (
    <form onSubmit={onSubmit} className='pa2 flex bb b--gray items-center'>
      <span className='mr1'>
        <BackButton />
      </span>
      <span className='mr2'>
        <ForwardButton />
      </span>
      <input
        className='input-reset bg-white-90 ba b--gray mr2 pa2 br2 db f6 w-100 outline-0'
        style={{ boxShadow: '2px 2px 4px 0 rgba(0,0,0,.06)' }}
        value={tab.search || ''}
        onChange={e => dispatch(setTabSearch({ tabId: tab.id, value: e.target.value }))}
        placeholder='Search or enter address'
      />
      <span className='nowrap mr1'>
        <span className='v-mid f7 charcoal'>{peers.length} <span className='charcoal-muted'>peers</span></span>
      </span>
    </form>
  )
}
