/*-
 * Copyright 2013 Alexander Peslyak
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted.
 *
 * THIS SOFTWARE IS PROVIDED BY THE AUTHOR AND CONTRIBUTORS ``AS IS'' AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 * ARE DISCLAIMED.  IN NO EVENT SHALL THE AUTHOR OR CONTRIBUTORS BE LIABLE
 * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
 * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS
 * OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION)
 * HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT
 * LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY
 * OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF
 * SUCH DAMAGE.
 */

#ifdef HAVE_SYS_MMAN_H
#include <sys/mman.h>
#endif
#include <errno.h>
#include <stdlib.h>

#include "crypto_scrypt.h"
#include "runtime.h"

#if !defined(MAP_ANON) && defined(MAP_ANONYMOUS)
# define MAP_ANON MAP_ANONYMOUS
#endif
#ifndef MAP_NOCORE
# ifdef MAP_CONCEAL
#  define MAP_NOCORE MAP_CONCEAL
# else
#  define MAP_NOCORE 0
# endif
#endif
#ifndef MAP_POPULATE
# define MAP_POPULATE 0
#endif

void *
escrypt_alloc_region(escrypt_region_t *region, size_t size)
{
    uint8_t *base, *aligned;
#if defined(MAP_ANON) && defined(HAVE_MMAP)
    if ((base = (uint8_t *) mmap(NULL, size, PR